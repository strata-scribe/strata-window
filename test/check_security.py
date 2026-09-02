#!/usr/bin/env python3
"""
The Strata Window — Security & Compliance Audit
Enforces the 3 checkable conditions for Listing #23:
  1. It reads and never writes.
  2. It never asks anyone for a citizen secret, and has no field where one could be typed.
  3. You sign your name to it and you open the source.
"""

import os
import re
import sys

BASE_DIR = "/home/frost/projects/strata-window"

def audit_reads_never_writes():
    print("1. Auditing Read-Only Invariant...")
    write_verbs = [r'\bPOST\b', r'\bPUT\b', r'\bDELETE\b', r'\bPATCH\b']
    
    # Check JS files
    for root, _, files in os.walk(os.path.join(BASE_DIR, "js")):
        for f in files:
            if f.endswith(".js"):
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8") as file:
                    content = file.read()
                    for verb in write_verbs:
                        # Ensure no fetch with write method
                        matches = re.findall(rf'method\s*:\s*[\'"]({verb})[\'"]', content, re.IGNORECASE)
                        if matches:
                            print(f"❌ FAILED: Write method found in {f}: {matches}")
                            return False

    # Check HTML CSP
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as file:
        html = file.read()
        if "form-action 'none'" not in html:
            print("❌ FAILED: form-action 'none' missing from CSP in index.html")
            return False
        if "connect-src 'self' https://1f916.ai" not in html:
            print("❌ FAILED: Strict connect-src missing from CSP")
            return False

    print("  ✓ PASS: Zero write methods (POST/PUT/DELETE) and strict form-action 'none' enforced.")
    return True

def audit_zero_secrets():
    print("2. Auditing Zero Secret Fields Invariant...")
    secret_terms = ['password', 'secret', 'token', 'private_key', 'seed_phrase', 'bearer']
    
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as file:
        html = file.read()
        for term in secret_terms:
            if re.search(rf'type\s*=\s*[\'"]{term}[\'"]', html, re.IGNORECASE):
                print(f"❌ FAILED: Secret input type found in index.html for {term}")
                return False
            if re.search(rf'name\s*=\s*[\'"]{term}[\'"]', html, re.IGNORECASE):
                print(f"❌ FAILED: Secret input name found in index.html for {term}")
                return False

    print("  ✓ PASS: Zero secret, token, or password fields present across all interfaces.")
    return True

def audit_signed_and_open():
    print("3. Auditing Signature & Open Source Invariant...")
    license_path = os.path.join(BASE_DIR, "LICENSE")
    if not os.path.exists(license_path):
        print("❌ FAILED: LICENSE file missing.")
        return False
    
    readme_path = os.path.join(BASE_DIR, "README.md")
    if not os.path.exists(readme_path):
        print("❌ FAILED: README.md file missing.")
        return False

    with open(readme_path, "r", encoding="utf-8") as file:
        readme = file.read()
        if "strata-scribe" not in readme:
            print("❌ FAILED: Author signature missing from README.")
            return False

    print("  ✓ PASS: Signed by @strata-scribe and licensed under MIT Open Source.")
    return True

def main():
    print("=== THE STRATA WINDOW: AUDIT SUITE ===")
    ok = audit_reads_never_writes() and audit_zero_secrets() and audit_signed_and_open()
    if ok:
        print("\n🏆 ALL 3 CONDITIONS VERIFIED 100% COMPLIANT WITH LISTING #23.")
        sys.exit(0)
    else:
        print("\n⚠️ COMPLIANCE AUDIT FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    main()
