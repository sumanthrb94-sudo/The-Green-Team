"""The demo agent must know the whole portfolio and never crash on a bad id."""

import pytest

from agent.prompt import FACTS, PORTFOLIO, build_system_prompt, resolve_project


class TestProjectResolution:
    @pytest.mark.parametrize("sent,expected", [
        # The website's sanctuary ids, exactly as src/App.tsx emits them.
        ("agartha", "agartha"),
        ("syl", "syl"),
        ("dates-county", "dates_county"),
        ("dates_county", "dates_county"),
        ("DATES-COUNTY", "dates_county"),
        (" agartha ", "agartha"),
    ])
    def test_website_ids_map_to_facts(self, sent, expected):
        assert resolve_project(sent) == expected

    @pytest.mark.parametrize("sent", [None, "", "unknown-project", "../etc/passwd"])
    def test_unknown_falls_back_to_portfolio(self, sent):
        assert resolve_project(sent) == PORTFOLIO

    def test_a_bad_id_never_raises(self):
        """A visitor on an unrecognised page still gets a working agent."""
        prompt = build_system_prompt(project="no-such-thing")
        assert "MODCON Agartha" in prompt


class TestPortfolioBrief:
    @pytest.fixture
    def prompt(self):
        return build_system_prompt(project=PORTFOLIO, channel="web")

    @pytest.mark.parametrize("name", [
        "MODCON Agartha", "MODCON SYL Residences", "Dates County by Planet Green",
    ])
    def test_all_three_projects_present(self, prompt, name):
        assert name in prompt

    @pytest.mark.parametrize("price", ["₹68.7 L", "₹4,499 per SFT", "₹18,000"])
    def test_all_prices_present(self, prompt, price):
        assert price in prompt

    def test_company_positioning_present(self, prompt):
        assert "AQI below 25" in prompt
        assert "developer pays us" in prompt

    def test_routing_rules_present(self, prompt):
        assert "Never list all three at once" in prompt

    def test_project_rera_numbers_are_available(self, prompt):
        # Dates County's project registrations are published on the site.
        assert "P02400002648" in prompt

    def test_project_rera_is_not_confused_with_agent_registration(self, prompt):
        # We hold no agent registration yet; the agent must still defer.
        assert "do not state a number" in prompt


class TestSingleProjectBrief:
    def test_single_project_carries_only_its_own_facts_block(self):
        prompt = build_system_prompt(project="syl")
        assert "PROJECT — MODCON SYL Residences" in prompt
        assert "PROJECT — Dates County by Planet Green" not in prompt
        # Dates County's price must not leak into a SYL conversation.
        assert "₹18,000" not in prompt

    def test_the_agent_still_knows_the_other_projects_exist(self):
        # It has to answer "what else do you have?" without inventing.
        assert "Dates County" in build_system_prompt(project="syl")

    def test_single_project_has_no_routing_block(self):
        assert "Never list all three" not in build_system_prompt(project="agartha")

    def test_company_context_is_always_present(self):
        # Even on a single-project page, "who are you?" must be answerable.
        assert "The Green Team" in build_system_prompt(project="agartha")


def test_facts_cover_every_website_sanctuary():
    """Guard against src/App.tsx gaining a project the agent doesn't know."""
    assert set(FACTS) == {"agartha", "syl", "dates_county"}
