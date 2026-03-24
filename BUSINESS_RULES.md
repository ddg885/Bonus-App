# BUSINESS RULES

1. Federal FY default starts October 1 (`calculateFiscalYear`).
2. Crosswalk maps raw type codes into normalized category/BLI/OE/bonus type.
3. Execution transform rules:
   - installments <= 1 => initial payout only
   - installments > 1 => annual payout stream
   - obligation FY anchored to effective date
4. Projection uses two-pass distribution:
   - Pass 1 equal split
   - Pass 2 unit shifts toward target average initial bonus
5. Budget reconciliation compares projected initial+anniversary against control totals by FY.
6. Safe defaults:
   - critical-column missing => hard validation failure
   - unmapped crosswalk => UNMAPPED fallback labels
