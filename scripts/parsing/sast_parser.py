import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from collections import defaultdict

class SASTParser:
    SEVERITY_MAP = {0: "info", 1: "warning", 2: "error"}
    CWE_MAPPING = {
        "security/detect-eval-with-expression": "CWE-95",
        "security/detect-non-literal-require": "CWE-494",
        "security/detect-non-literal-regexp": "CWE-400",
        "security/detect-non-literal-fs-filename": "CWE-73",
        "security/detect-unsafe-regex": "CWE-1333",
        "security/detect-buffer-noassert": "CWE-703",
        "security/detect-child-process": "CWE-78",
        "security/detect-disable-mustache-escape": "CWE-79",
        "security/detect-no-csrf-before-method-override": "CWE-352",
        "security/detect-possible-timing-attacks": "CWE-208",
        "security/detect-pseudoRandomBytes": "CWE-338",
        "security/detect-object-injection": "CWE-94",
        "no-secrets/no-secrets": "CWE-798",
    }
    RISK_LEVELS = {
        "security/detect-eval-with-expression": "high",
        "security/detect-object-injection": "medium",
        "security/detect-child-process": "high",
        "security/detect-unsafe-regex": "high",
        "no-secrets/no-secrets": "critical",
        "security/detect-non-literal-fs-filename": "medium",
    }

    def __init__(self, report_dir: str = "."):
        self.report_dir = Path(report_dir)
        self.vulnerabilities = []
        self.stats = {
            "total_files_scanned": 0,
            "files_with_issues": 0,
            "total_vulnerabilities": 0,
            "by_severity": defaultdict(int),
            "by_type": defaultdict(int),
            "by_component": defaultdict(int)
        }

    def parse_eslint_report(self, report_path: str, component: str) -> List[Dict]:
        vulnerabilities = []
        try:
            with open(report_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.stats["total_files_scanned"] += len(data)
            for file_result in data:
                file_path = file_result.get("filePath", "")
                messages = file_result.get("messages", [])
                if not messages:
                    continue
                self.stats["files_with_issues"] += 1
                for message in messages:
                    vuln = self._normalize_vulnerability(message, file_path, component)
                    vulnerabilities.append(vuln)
                    self.stats["total_vulnerabilities"] += 1
                    self.stats["by_severity"][vuln["severity"]] += 1
                    self.stats["by_type"][vuln["rule_id"]] += 1
                    self.stats["by_component"][component] += 1
        except FileNotFoundError:
            print(f"Warning: Report not found: {report_path}")
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON in {report_path}: {e}")
        except Exception as e:
            print(f"Unexpected error parsing {report_path}: {e}")
        return vulnerabilities

    def _normalize_vulnerability(self, message: Dict, file_path: str, component: str) -> Dict:
        rule_id = message.get("ruleId", "unknown")
        severity_num = message.get("severity", 1)
        relative_path = self._extract_relative_path(file_path, component)
        risk_level = self.RISK_LEVELS.get(rule_id, "low")
        if severity_num == 2:
            risk_level = "high"
        return {
            "id": self._generate_vuln_id(component, rule_id, relative_path, message.get("line", 0)),
            "source": "SAST",
            "tool": "ESLint-Security",
            "component": component,
            "rule_id": rule_id,
            "type": self._get_vulnerability_type(rule_id),
            "severity": self.SEVERITY_MAP.get(severity_num, "info"),
            "risk_level": risk_level,
            "message": message.get("message", ""),
            "description": self._enhance_description(rule_id, message.get("message", "")),
            "location": {
                "file": relative_path,
                "line": message.get("line", 0),
                "column": message.get("column", 0),
                "end_line": message.get("endLine"),
                "end_column": message.get("endColumn")
            },
            "cwe": self.CWE_MAPPING.get(rule_id, "CWE-Unknown"),
            "recommendation": self._get_recommendation(rule_id),
            "owasp_category": self._map_to_owasp(rule_id),
            "nist_csf_function": self._map_to_nist_csf(rule_id)
        }

    def _extract_relative_path(self, full_path: str, component: str) -> str:
        try:
            parts = full_path.split(f"/{component}/")
            if len(parts) > 1:
                return f"{component}/{parts[-1]}"
            return full_path.split("/")[-1]
        except:
            return full_path

    def _generate_vuln_id(self, component: str, rule_id: str, file_path: str, line: int) -> str:
        import hashlib
        unique_str = f"{component}:{rule_id}:{file_path}:{line}"
        hash_obj = hashlib.md5(unique_str.encode())
        return f"SAST-{hash_obj.hexdigest()[:8].upper()}"

    def _get_vulnerability_type(self, rule_id: str) -> str:
        type_map = {
            "security/detect-eval-with-expression": "Code Injection",
            "security/detect-object-injection": "Object Injection",
            "security/detect-child-process": "Command Injection",
            "security/detect-unsafe-regex": "ReDoS (Regular Expression Denial of Service)",
            "no-secrets/no-secrets": "Hardcoded Secrets",
            "security/detect-non-literal-fs-filename": "Path Traversal",
            "security/detect-non-literal-require": "Arbitrary Module Loading",
            "security/detect-non-literal-regexp": "Regular Expression Injection",
            "security/detect-buffer-noassert": "Buffer Overflow",
            "security/detect-possible-timing-attacks": "Timing Attack",
            "security/detect-pseudoRandomBytes": "Weak Random Number Generation",
            "security/detect-no-csrf-before-method-override": "CSRF Vulnerability",
            "security/detect-disable-mustache-escape": "Cross-Site Scripting (XSS)"
        }
        return type_map.get(rule_id, rule_id)

    def _enhance_description(self, rule_id: str, original_message: str) -> str:
        descriptions = {
            "security/detect-eval-with-expression": (
                "Use of eval() or similar functions can lead to code injection vulnerabilities."
            ),
            "security/detect-object-injection": (
                "Generic object injection can allow attackers to access or modify object properties."
            ),
            "no-secrets/no-secrets": (
                "Hardcoded secrets (passwords, API keys, tokens) in source code pose a critical security risk."
            ),
            "security/detect-child-process": (
                "Spawning child processes with user input can lead to command injection vulnerabilities."
            ),
            "security/detect-unsafe-regex": (
                "Complex regular expressions can cause catastrophic backtracking, leading to ReDoS attacks."
            )
        }
        base_description = descriptions.get(rule_id, original_message)
        return f"{base_description} | Original: {original_message}"

    def _get_recommendation(self, rule_id: str) -> str:
        recommendations = {
            "security/detect-eval-with-expression": (
                "Avoid using eval(), Function() constructor, or similar dynamic code execution."
            ),
            "security/detect-object-injection": (
                "Validate and sanitize all object keys before using bracket notation."
            ),
            "no-secrets/no-secrets": (
                "Remove all hardcoded secrets from source code immediately."
            ),
            "security/detect-child-process": (
                "Never pass user input directly to exec(), spawn(), or execFile()."
            ),
            "security/detect-unsafe-regex": (
                "Simplify regular expressions to avoid catastrophic backtracking."
            ),
            "security/detect-non-literal-fs-filename": (
                "Validate and sanitize file paths. Use path.join() and path.normalize()."
            ),
            "security/detect-possible-timing-attacks": (
                "Use constant-time comparison functions."
            )
        }
        return recommendations.get(rule_id, "Review the security implication of this code pattern and apply security best practices.")

    def _map_to_owasp(self, rule_id: str) -> str:
        owasp_map = {
            "security/detect-eval-with-expression": "A03:2021 - Injection",
            "security/detect-object-injection": "A03:2021 - Injection",
            "security/detect-child-process": "A03:2021 - Injection",
            "no-secrets/no-secrets": "A07:2021 - Identification and Authentication Failures",
            "security/detect-unsafe-regex": "A06:2021 - Vulnerable and Outdated Components",
            "security/detect-non-literal-fs-filename": "A01:2021 - Broken Access Control",
            "security/detect-disable-mustache-escape": "A03:2021 - Injection (XSS)",
            "security/detect-no-csrf-before-method-override": "A01:2021 - Broken Access Control",
            "security/detect-possible-timing-attacks": "A02:2021 - Cryptographic Failures"
        }
        return owasp_map.get(rule_id, "N/A")

    def _map_to_nist_csf(self, rule_id: str) -> str:
        if "secrets" in rule_id:
            return "PR.AC - Access Control"
        elif "injection" in rule_id or "eval" in rule_id:
            return "PR.DS - Data Security"
        elif "timing" in rule_id:
            return "PR.DS - Data Security"
        else:
            return "PR.IP - Information Protection Processes"

    def parse_all_reports(self) -> Dict:
        client_report = self.report_dir / "sast-eslint-client.json"
        if client_report.exists():
            client_vulns = self.parse_eslint_report(str(client_report), "client")
            self.vulnerabilities.extend(client_vulns)
        api_report = self.report_dir / "sast-eslint-api.json"
        if api_report.exists():
            api_vulns = self.parse_eslint_report(str(api_report), "api")
            self.vulnerabilities.extend(api_vulns)
        return self._generate_unified_report()

    def _generate_unified_report(self) -> Dict:
        risk_score = self._calculate_risk_score()
        return {
            "scan_metadata": {
                "scan_type": "SAST",
                "tool": "ESLint Security + No-Secrets",
                "scan_date": datetime.now().isoformat(),
                "project": "ChronoGaz",
                "parser_version": "1.0.0"
            },
            "summary": {
                "total_files_scanned": self.stats["total_files_scanned"],
                "files_with_issues": self.stats["files_with_issues"],
                "total_vulnerabilities": self.stats["total_vulnerabilities"],
                "risk_score": risk_score,
                "severity_distribution": dict(self.stats["by_severity"]),
                "component_distribution": dict(self.stats["by_component"])
            },
            "top_vulnerabilities": self._get_top_vulnerabilities(5),
            "vulnerabilities": self.vulnerabilities,
            "statistics": {
                "by_type": dict(self.stats["by_type"]),
                "by_cwe": self._aggregate_by_cwe(),
                "by_owasp": self._aggregate_by_owasp()
            }
        }

    def _calculate_risk_score(self) -> float:
        if self.stats["total_vulnerabilities"] == 0:
            return 0.0
        weights = {"info": 1, "warning": 3, "error": 5}
        total_weight = sum(
            count * weights.get(severity, 1)
            for severity, count in self.stats["by_severity"].items()
        )
        max_possible = self.stats["total_vulnerabilities"] * 5
        risk_score = (total_weight / max_possible) * 100 if max_possible > 0 else 0
        return round(risk_score, 2)

    def _get_top_vulnerabilities(self, limit: int = 5) -> List[Dict]:
        risk_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        severity_order = {"error": 3, "warning": 2, "info": 1}
        sorted_vulns = sorted(
            self.vulnerabilities,
            key=lambda v: (
                risk_order.get(v["risk_level"], 0),
                severity_order.get(v["severity"], 0)
            ),
            reverse=True
        )
        return sorted_vulns[:limit]

    def _aggregate_by_cwe(self) -> Dict[str, int]:
        cwe_counts = defaultdict(int)
        for vuln in self.vulnerabilities:
            cwe_counts[vuln["cwe"]] += 1
        return dict(cwe_counts)

    def _aggregate_by_owasp(self) -> Dict[str, int]:
        owasp_counts = defaultdict(int)
        for vuln in self.vulnerabilities:
            owasp_counts[vuln["owasp_category"]] += 1
        return dict(owasp_counts)

    def save_report(self, output_path: str = "unified_sast_report.json"):
        report = self._generate_unified_report()
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"Unified SAST report saved to: {output_file}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="SAST Parser - Parse ESLint Security Reports")
    parser.add_argument("-i", "--input-dir", default=".", help="Directory containing SAST reports")
    parser.add_argument("-o", "--output", default="unified_sast_report.json", help="Output file path")
    args = parser.parse_args()
    sast_parser = SASTParser(report_dir=args.input_dir)
    report = sast_parser.parse_all_reports()
    sast_parser.save_report(args.output)
    top_vulns = report["top_vulnerabilities"]
    if top_vulns:
        for i, vuln in enumerate(top_vulns, 1):
            print(f"{i}. [{vuln['risk_level'].upper()}] {vuln['type']}")
            print(f"   File: {vuln['location']['file']}:{vuln['location']['line']}")
            print(f"   CWE: {vuln['cwe']} | OWASP: {vuln['owasp_category']}")
    else:
        print("No vulnerabilities found!")

if __name__ == "__main__":
    main()
