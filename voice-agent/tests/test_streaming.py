"""LLM output arrives a fragment at a time, not a sentence at a time.

The first version of the filter normalised each fragment independently. A
price split across three tokens — "ధర ", "₹68", ".7 L" — never matched, so
digits reached the TTS raw, and the word cap counted per fragment, which is
meaningless. These tests feed text the way a real LLM emits it.
"""

import pytest

from agent.processors import MAX_SENTENCES, StreamingTurn


def feed(turn: StreamingTurn, tokens: list[str]) -> list[str]:
    out = []
    for token in tokens:
        out.extend(turn.add(token))
    out.extend(turn.flush())
    return out


class TestSentenceAssembly:
    def test_a_sentence_split_across_tokens_is_reassembled(self):
        out = feed(StreamingTurn(), ["నమస్కారం ", "సర్", ". "])
        assert out == ["నమస్కారం సర్."]

    def test_nothing_is_released_before_a_sentence_ends(self):
        turn = StreamingTurn()
        assert turn.add("ధర ") == []
        assert turn.add("₹68") == []
        assert turn.add(".7 L నుంచి సర్") == []
        # Only on the terminator does it become speakable.
        assert turn.add(". ") == ["ధర అరవై ఎనిమిది లక్షల డెబ్బై వేల రూపాయలు నుంచి సర్."]

    def test_currency_split_across_tokens_still_normalises(self):
        """The bug this file exists for."""
        out = feed(StreamingTurn(), ["ధర ", "₹", "68", ".7", " L", " నుంచి."])
        assert len(out) == 1
        assert not any(c.isdigit() for c in out[0]), out[0]
        assert "అరవై ఎనిమిది లక్షల డెబ్బై వేల" in out[0]

    def test_first_sentence_is_released_before_the_second_arrives(self):
        """This is what keeps latency down — TTS starts on sentence one."""
        turn = StreamingTurn()
        assert turn.add("మొదటి వాక్యం. ") == ["మొదటి వాక్యం."]
        assert turn.add("రెండవ") == []

    def test_trailing_text_without_a_full_stop_is_still_spoken(self):
        assert feed(StreamingTurn(), ["ముగింపు లేకుండా"]) == ["ముగింపు లేకుండా"]

    def test_question_and_danda_end_sentences(self):
        assert feed(StreamingTurn(), ["ఎంత? "]) == ["ఎంత?"]
        assert feed(StreamingTurn(), ["ముగింపు। "]) == ["ముగింపు।"]


class TestTurnCap:
    def test_cap_applies_across_the_response_not_per_token(self):
        turn = StreamingTurn()
        out = feed(turn, ["ఒకటి. ", "రెండు. ", "మూడు. ", "నాలుగు. "])
        assert len(out) == MAX_SENTENCES
        assert turn.truncated

    def test_a_short_reply_is_not_truncated(self):
        turn = StreamingTurn()
        feed(turn, ["ఒకటి. ", "రెండు. "])
        assert not turn.truncated

    def test_word_cap_stops_a_rambling_reply(self):
        turn = StreamingTurn(max_sentences=99)
        long_sentence = " ".join(["పదం"] * 40) + ". "
        out = feed(turn, [long_sentence, "ఇంకా ఒక వాక్యం. "])
        assert len(out) == 1
        assert turn.truncated


class TestControlTokens:
    def test_control_token_is_collected_and_never_spoken(self):
        turn = StreamingTurn()
        out = feed(turn, ["సరే సర్. ", "[[BOOKED]]"])
        assert turn.controls == ["[[BOOKED]]"]
        assert all("[[" not in s for s in out)

    def test_token_split_across_tokens_still_caught(self):
        turn = StreamingTurn()
        feed(turn, ["సరే. ", "[[", "DNC", "]]"])
        assert turn.controls == ["[[DNC]]"]

    def test_reset_clears_state_between_turns(self):
        turn = StreamingTurn()
        feed(turn, ["ఒకటి. ", "[[BOOKED]]"])
        turn.reset()
        assert turn.controls == []
        assert not turn.truncated
        assert feed(turn, ["రెండు. "]) == ["రెండు."]
