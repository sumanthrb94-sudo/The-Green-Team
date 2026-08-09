"""Tests for turn capping, control tokens and the compliance guardrails."""

from datetime import datetime

import pytest

from agent.compliance import IST, CallWindow, normalise_phone
from agent.processors import CallState, cap_turn, prepare_for_speech
from agent.prompt import build_system_prompt, extract_controls


class TestTurnCap:
    def test_short_turn_passes_through(self):
        text = "నమస్కారం సర్. మీకు ఒక్క నిమిషం టైం ఉందా?"
        out, truncated = cap_turn(text)
        assert out == text
        assert not truncated

    def test_third_sentence_is_dropped(self):
        text = "ఒకటి. రెండు. మూడు."
        out, truncated = cap_turn(text)
        assert out == "ఒకటి. రెండు."
        assert truncated

    def test_long_monologue_is_cut_at_a_sentence_boundary(self):
        long_sentence = " ".join(["పదం"] * 40)
        out, truncated = cap_turn(f"మొదటి వాక్యం. {long_sentence}.")
        assert truncated
        # Never cut mid-sentence — that sounds like a dropped call.
        assert out == "మొదటి వాక్యం."

    def test_single_over_long_sentence_is_kept_whole(self):
        # Better to run over the word cap than to clip a sentence in half.
        text = " ".join(["పదం"] * 50) + "."
        out, truncated = cap_turn(text)
        assert out == text
        assert not truncated

    def test_empty_input(self):
        assert cap_turn("") == ("", False)


class TestControlTokens:
    def test_dnc_is_stripped_from_speech(self):
        text, controls = extract_controls("క్షమించండి సర్. [[DNC]]")
        assert "[[DNC]]" not in text
        assert controls == ["[[DNC]]"]

    def test_no_tokens(self):
        text, controls = extract_controls("నమస్కారం")
        assert controls == []
        assert text == "నమస్కారం"

    def test_state_applies_controls(self):
        state = CallState()
        state.apply(["[[DNC]]"])
        assert state.do_not_call
        assert state.should_hang_up

    def test_booked_does_not_hang_up(self):
        state = CallState()
        state.apply(["[[BOOKED]]"])
        assert state.booked
        assert not state.should_hang_up


class TestPrepareForSpeech:
    def test_full_transform(self):
        raw = "ధర ₹68.7 L నుంచి సర్. [[BOOKED]]"
        speech, controls, truncated = prepare_for_speech(raw)
        assert controls == ["[[BOOKED]]"]
        assert "[[" not in speech
        assert not any(c.isdigit() for c in speech)
        assert "అరవై ఎనిమిది లక్షల డెబ్బై వేల రూపాయలు" in speech

    def test_caller_never_hears_a_control_token(self):
        speech, _, _ = prepare_for_speech("సరే సర్. [[TRANSFER]]")
        assert "TRANSFER" not in speech


class TestCallWindow:
    @pytest.mark.parametrize("hour,expected", [
        (8, False), (9, True), (14, True), (20, True), (21, False), (23, False),
    ])
    def test_window_boundaries(self, hour, expected):
        now = datetime(2026, 8, 9, hour, 30, tzinfo=IST)
        assert CallWindow().is_open(now) is expected

    def test_utc_input_is_converted_to_ist(self):
        # 04:00 UTC is 09:30 IST — inside the window.
        from datetime import timezone
        now = datetime(2026, 8, 9, 4, 0, tzinfo=timezone.utc)
        assert CallWindow().is_open(now)

        # 16:00 UTC is 21:30 IST — outside it.
        now = datetime(2026, 8, 9, 16, 0, tzinfo=timezone.utc)
        assert not CallWindow().is_open(now)


class TestPhoneNormalisation:
    @pytest.mark.parametrize("raw", [
        "+91 98765 43210", "09876543210", "9876543210",
        "+919876543210", "91-98765-43210",
    ])
    def test_all_forms_collapse_to_one(self, raw):
        assert normalise_phone(raw) == "919876543210"


class TestPrompt:
    def test_facts_are_included(self):
        prompt = build_system_prompt("agartha")
        assert "₹68.7 L" in prompt
        assert "36" in prompt

    def test_lead_name_personalises_the_call(self):
        assert "Rahul" in build_system_prompt("agartha", lead_name="Rahul")

    def test_syl_project_switches_the_brief(self):
        prompt = build_system_prompt("syl")
        assert "Tukkuguda" in prompt
        assert "₹4,499 per SFT" in prompt

    def test_prompt_forbids_naming_approval_bodies(self):
        # The script flagged HMDA/DTCP as unverified — the agent must not
        # assert them on a live call.
        assert "Do NOT name specific approval bodies" in build_system_prompt()
