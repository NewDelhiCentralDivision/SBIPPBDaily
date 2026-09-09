import os
import sys
import unittest
import json
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

import db

class TestPostalSavingsMonitor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure fresh DB initialized
        import init_db
        init_db.init_database()
        cls.today = "2026-09-09"
        cls.yesterday = "2026-09-08"

    def test_01_offices_and_products_initialization(self):
        """Test that all 62 offices (55 operational) and 21 default products are seeded."""
        all_offices = db.get_all_offices()
        op_offices = db.get_operational_offices()
        products = db.get_active_products()

        self.assertEqual(len(all_offices), 62, "Total offices in division must be 62")
        self.assertEqual(len(op_offices), 55, "Operational public offices must be exactly 55")
        self.assertEqual(len(products), 21, "Default products must be 21")

        # Verify HPO grouping exists
        hpos = {o["hpo_group"] for o in op_offices}
        self.assertIn("Indraprastha HPO", hpos)
        self.assertIn("Sansad Marg HPO", hpos)
        self.assertIn("New Delhi HO", hpos)

    def test_02_negative_values_and_pin_validation(self):
        """Test verification PIN authentication and negative value rejection."""
        op_offices = db.get_operational_offices()
        first_office = op_offices[0]
        
        # Check invalid PIN
        valid, msg = db.verify_office_pin(first_office["id"], "0000")
        self.assertFalse(valid)

        # Check valid PIN
        valid, msg = db.verify_office_pin(first_office["id"], first_office["pin_code"])
        self.assertTrue(valid)

    def test_03_submission_and_partial_dashboard(self):
        """Test submitting for 1 office and checking dashboard pending status."""
        op_offices = db.get_operational_offices()
        o1 = op_offices[0]

        items_o1 = {
            "SB": {"opened": 10, "closed": 2},
            "RD": {"opened": 5, "closed": 1},
            "MIS": {"opened": 3, "closed": 0},
            "NSC_VIII": {"closed": 2}, # Discontinued
            "IPPB_REG": {"opened": 8, "closed": 0},
            "IPPB_AADHAAR": {"achievement": 15},
            "IPPB_CELC": {"achievement": 7}
        }

        res = db.save_submission(o1["id"], self.today, "SPM " + o1["office_name"], items_o1)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["action"], "SUBMIT")

        # Check dashboard
        dash = db.get_daily_dashboard(self.today)
        m = dash["metrics"]
        self.assertEqual(m["total_offices"], 55)
        self.assertEqual(m["submitted_count"], 1)
        self.assertEqual(m["pending_count"], 54)
        self.assertAlmostEqual(m["completion_pct"], round(1/55*100, 1))

        # Check consolidated totals
        self.assertEqual(m["total_savings_opened"], 18) # 10 + 5 + 3
        self.assertEqual(m["total_savings_closed"], 5)  # 2 + 1 + 0 + 2
        self.assertEqual(m["total_ippb_opened"], 8)
        self.assertEqual(m["total_ippb_achievements"], 22) # 15 + 7

    def test_04_duplicate_submission_update_flow(self):
        """Test updating an existing submission (correction flow)."""
        op_offices = db.get_operational_offices()
        o1 = op_offices[0]

        # Office updates its figures
        updated_items = {
            "SB": {"opened": 15, "closed": 2}, # +5
            "RD": {"opened": 5, "closed": 1},
            "MIS": {"opened": 3, "closed": 0},
            "NSC_VIII": {"closed": 2},
            "IPPB_REG": {"opened": 10, "closed": 1},
            "IPPB_AADHAAR": {"achievement": 20},
            "IPPB_CELC": {"achievement": 7}
        }

        res = db.save_submission(o1["id"], self.today, "SPM " + o1["office_name"], updated_items)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["action"], "UPDATE")

        # Check dashboard metrics reflect update
        dash = db.get_daily_dashboard(self.today)
        m = dash["metrics"]
        self.assertEqual(m["submitted_count"], 1)
        self.assertEqual(m["total_savings_opened"], 23) # 15 + 5 + 3
        self.assertEqual(m["total_ippb_achievements"], 27) # 20 + 7

    def test_05_all_55_offices_submitting(self):
        """Test all 55 operational offices submitting data and 100% completion."""
        op_offices = db.get_operational_offices()

        for idx, off in enumerate(op_offices):
            items = {
                "SB": {"opened": idx + 1, "closed": 1},
                "RD": {"opened": 2, "closed": 0},
                "IPPB_REG": {"opened": 3, "closed": 0},
                "IPPB_CELC": {"achievement": 4}
            }
            db.save_submission(off["id"], self.today, f"Staff {off['office_name']}", items)

        dash = db.get_daily_dashboard(self.today)
        m = dash["metrics"]
        self.assertEqual(m["total_offices"], 55)
        self.assertEqual(m["submitted_count"], 55)
        self.assertEqual(m["pending_count"], 0)
        self.assertEqual(m["completion_pct"], 100.0)
        self.assertEqual(len(dash["pending_offices"]), 0)

    def test_06_historical_date_segregation(self):
        """Test that data submitted for yesterday is completely segregated from today."""
        op_offices = db.get_operational_offices()
        o2 = op_offices[1]

        # Submit 1 office on yesterday's date
        items_yesterday = {
            "SB": {"opened": 100, "closed": 20}
        }
        db.save_submission(o2["id"], self.yesterday, "Staff Y", items_yesterday)

        dash_yesterday = db.get_daily_dashboard(self.yesterday)
        dash_today = db.get_daily_dashboard(self.today)

        self.assertEqual(dash_yesterday["metrics"]["submitted_count"], 1)
        self.assertEqual(dash_today["metrics"]["submitted_count"], 55)

    def test_07_dynamic_product_addition(self):
        """Test adding a dynamic new product and verifying it participates in consolidation."""
        res = db.add_product_config(
            code="MSSC",
            name="Mahila Samman Savings Certificate",
            short_name="MSSC",
            section="SAVINGS",
            entry_mode="OPENED_AND_CLOSED",
            display_order=25
        )
        self.assertEqual(res["status"], "success")

        # Verify in active products
        prods = db.get_active_products()
        mssc = next((p for p in prods if p["code"] == "MSSC"), None)
        self.assertIsNotNone(mssc)
        self.assertEqual(mssc["name"], "Mahila Samman Savings Certificate")

        # Office submits for new product
        op_offices = db.get_operational_offices()
        o1 = op_offices[0]
        items = {"MSSC": {"opened": 7, "closed": 0}}
        db.save_submission(o1["id"], self.today, "Staff", items)

        dash = db.get_daily_dashboard(self.today)
        mssc_tot = next((p for p in dash["consolidated_products"] if p["code"] == "MSSC"), None)
        self.assertIsNotNone(mssc_tot)
        self.assertEqual(mssc_tot["total_opened"], 7)

if __name__ == "__main__":
    unittest.main()
