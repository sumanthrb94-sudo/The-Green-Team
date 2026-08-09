"""The web and phone channels share everything except the opening move.

Web ships without DLT registration because it never touches a telecom network;
phone does not. These tests pin the differences that matter so a later prompt
edit can't quietly turn the web agent into a cold caller.
"""

import pytest

from agent.prompt import build_system_prompt


class TestOpening:
    def test_phone_asks_permission(self):
        prompt = build_system_prompt(channel="phone")
        assert "ask for one minute" in prompt

    def test_web_never_asks_permission(self):
        prompt = build_system_prompt(channel="web")
        assert "Never ask whether they" in prompt   # wraps in the source
        # The state machine must agree with the opening instruction — the
        # phone wording of state 1 would contradict it.
        assert "Ask for one minute" not in prompt
        assert "outbound call" not in prompt

    def test_web_discloses_ai_in_the_opening(self):
        assert "you are an AI assistant" in build_system_prompt(channel="web")

    def test_unknown_channel_falls_back_to_phone(self):
        # A typo must degrade to the stricter channel, never the looser one.
        assert build_system_prompt(channel="carrier-pigeon") == \
               build_system_prompt(channel="phone")


class TestSharedBehaviour:
    """Everything that decides whether it sounds human is channel-independent."""

    @pytest.mark.parametrize("channel", ["web", "phone"])
    def test_turn_cap_is_present(self, channel):
        assert "Maximum 2 sentences" in build_system_prompt(channel=channel)

    @pytest.mark.parametrize("channel", ["web", "phone"])
    def test_ai_identity_is_never_denied(self, channel):
        assert "Never claim to be a person" in build_system_prompt(channel=channel)

    @pytest.mark.parametrize("channel", ["web", "phone"])
    def test_dnc_stop_condition_survives(self, channel):
        assert "[[DNC]]" in build_system_prompt(channel=channel)

    @pytest.mark.parametrize("channel", ["web", "phone"])
    def test_facts_are_identical(self, channel):
        assert "₹68.7 L" in build_system_prompt(channel=channel)


class TestRERA:
    def test_without_a_number_the_agent_defers(self):
        prompt = build_system_prompt()
        assert "do not state a number" in prompt

    def test_with_a_number_the_agent_may_state_it(self):
        prompt = build_system_prompt(rera_reg_no="TG/AGENT/1234")
        assert "TG/AGENT/1234" in prompt
        assert "do not state a number" not in prompt

    def test_no_number_is_ever_fabricated(self):
        """The brief must not contain anything that looks like a reg number."""
        import re
        prompt = build_system_prompt()
        assert not re.search(r"TG/\w+/\d+", prompt)
