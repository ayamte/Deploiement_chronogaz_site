#!/usr/bin/env python3
"""
SCA Parser - NPM Audit Analysis
=================================
Parses NPM Audit reports (SCA) and normalizes them into a unified format.

Author: DevSecOps Team
Project: ChronoGaz Security Analysis
Task: Report Parsing (Task 3)
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from collections import defaultdict


class SCAParser:
    """Parser for NPM Audit reports (Software Composition Analysis)"""
    
    # Severity mapping
    SEVERITY_MAP = {
        "info": "info",
        "low": "low",
        "moderate": "medium",
        "high": "high",
        "critical": "critical"
    }
    
    # Risk score weights
    SEVERITY_WEIGHTS = {
        "info": 1,
        "low": 2,
        "medium": 5,
        "high": 8,
        "critical": 10
    }
    
    def __init__(self, report_dir: str = "."):
        """Initialize the SCA parser"""
        self.report_dir = Path(report_dir)
        self.vulnerabilities = []
        self.stats = {
            "total_packages": 0,
            "vulnerable_packages": 0,
            "total_vulnerabilities": 0,
            "by_severity": defaultdict(int),
            "by_component": defaultdict(int),
            "by_package": defaultdict(int)
        }
    
    def parse_npm_audit(self, report_path: str, component: str, variant: str) -> List[Dict]:
        """Parse an NPM audit report"""
        vulnerabilities = []
        
        try:
            with open(report_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            metadata = data.get("metadata", {})
            vuln_metadata = metadata.get("vulnerabilities", {})
            deps_metadata = metadata.get("dependencies", {})
            
            # Update stats
            self.stats["total_packages"] += deps_metadata.get("total", 0)
            
            vulns_dict = data.get("vulnerabilities", {})
            
            for package_name, vuln_data in vulns_dict.items():
                # Parse each vulnerability
                vuln = self._normalize_vulnerability(
                    package_name, vuln_data, component, variant
                )
                vulnerabilities.append(vuln)
                
                # Update statistics
                self.stats["total_vulnerabilities"] += 1
                self.stats["vulnerable_packages"] += 1
                self.stats["by_severity"][vuln["severity"]] += 1
                self.stats["by_component"][component] += 1
                self.stats["by_package"][package_name] += 1
            
            print(f"✅ Parsed {report_path}: {len(vulnerabilities)} vulnerabilities found")
            
        except FileNotFoundError:
            print(f"⚠️  Warning: Report not found: {report_path}")
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON in {report_path}: {e}")
        except Exception as e:
            print(f"❌ Unexpected error parsing {report_path}: {e}")
        
        return vulnerabilities
    
    def _normalize_vulnerability(self, package_name: str, vuln_data: Dict, 
                                  component: str, variant: str) -> Dict:
        """Normalize a vulnerability into standard format"""
        
        severity = vuln_data.get("severity", "unknown")
        via = vuln_data.get("via", [])
        
        # Extract detailed advisory info
        advisories = []
        cwe_list = []
        cvss_scores = []
        
        for item in via:
            if isinstance(item, dict):
                advisories.append({
                    "id": item.get("source"),
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "cwe": item.get("cwe", []),
                    "cvss": item.get("cvss", {})
                })
                cwe_list.extend(item.get("cwe", []))
                cvss = item.get("cvss", {})
                if cvss.get("score"):
                    cvss_scores.append(cvss.get("score"))
        
        # Calculate risk level
        risk_level = self._calculate_risk_level(severity, cvss_scores)
        
        # Get fix information
        fix_available = vuln_data.get("fixAvailable", False)
        fix_info = None
        if isinstance(fix_available, dict):
            fix_info = {
                "package": fix_available.get("name"),
                "version": fix_available.get("version"),
                "is_breaking": fix_available.get("isSemVerMajor", False)
            }
        
        return {
            "id": self._generate_vuln_id(component, package_name, variant),
            "source": "SCA",
            "tool": "NPM Audit",
            "component": component,
            "variant": variant,
            "package": package_name,
            "severity": self.SEVERITY_MAP.get(severity, severity),
            "risk_level": risk_level,
            "is_direct": vuln_data.get("isDirect", False),
            "affected_range": vuln_data.get("range", "unknown"),
            "advisories": advisories,
            "cwe": list(set(cwe_list)),
            "cvss_scores": cvss_scores,
            "max_cvss": max(cvss_scores) if cvss_scores else 0,
            "effects": vuln_data.get("effects", []),
            "fix_available": bool(fix_available),
            "fix_info": fix_info,
            "owasp_category": self._map_to_owasp(cwe_list),
            "nist_csf_function": "ID.RA - Risk Assessment"
        }
    
    def _generate_vuln_id(self, component: str, package: str, variant: str) -> str:
        """Generate unique vulnerability ID"""
        import hashlib
        unique_str = f"{component}:{package}:{variant}"
        hash_obj = hashlib.md5(unique_str.encode())
        return f"SCA-{hash_obj.hexdigest()[:8].upper()}"
    
    def _calculate_risk_level(self, severity: str, cvss_scores: List[float]) -> str:
        """Calculate risk level based on severity and CVSS"""
        severity_lower = severity.lower()
        
        if severity_lower == "critical":
            return "critical"
        elif severity_lower == "high":
            return "high"
        elif severity_lower == "moderate":
            # Check CVSS score
            if cvss_scores and max(cvss_scores) >= 7.0:
                return "high"
            return "medium"
        elif severity_lower == "low":
            return "low"
        else:
            return "low"
    
    def _map_to_owasp(self, cwe_list: List[str]) -> str:
        """Map CWE to OWASP Top 10 category"""
        owasp_map = {
            "CWE-20": "A03:2021 - Injection",
            "CWE-22": "A01:2021 - Broken Access Control",
            "CWE-74": "A03:2021 - Injection",
            "CWE-77": "A03:2021 - Injection",
            "CWE-78": "A03:2021 - Injection",
            "CWE-79": "A03:2021 - Injection (XSS)",
            "CWE-94": "A03:2021 - Injection",
            "CWE-287": "A07:2021 - Identification and Authentication Failures",
            "CWE-327": "A02:2021 - Cryptographic Failures",
            "CWE-352": "A01:2021 - Broken Access Control (CSRF)",
            "CWE-400": "A06:2021 - Vulnerable Components",
            "CWE-405": "A04:2021 - Insecure Design",
            "CWE-436": "A03:2021 - Injection",
            "CWE-601": "A01:2021 - Broken Access Control",
            "CWE-770": "A04:2021 - Insecure Design",
            "CWE-918": "A10:2021 - SSRF",
            "CWE-1321": "A06:2021 - Vulnerable Components",
            "CWE-1333": "A06:2021 - Vulnerable Components (ReDoS)"
        }
        
        for cwe in cwe_list:
            if cwe in owasp_map:
                return owasp_map[cwe]
        
        return "A06:2021 - Vulnerable and Outdated Components"
    
    def parse_all_reports(self) -> Dict:
        """Parse all SCA reports"""
        print("=" * 70)
        print("🔍 SCA PARSER - NPM Audit Analysis")
        print("=" * 70)
        
        # Parse all variants
        reports = [
            ("sca-client-production.json", "client", "production"),
            ("sca-client-vulnerable.json", "client", "vulnerable"),
            ("sca-api-production.json", "api", "production"),
            ("sca-api-vulnerable.json", "api", "vulnerable")
        ]
        
        for filename, component, variant in reports:
            report_path = self.report_dir / filename
            if report_path.exists():
                vulns = self.parse_npm_audit(str(report_path), component, variant)
                self.vulnerabilities.extend(vulns)
        
        print("\n" + "=" * 70)
        print("📊 PARSING SUMMARY")
        print("=" * 70)
        print(f"Total packages: {self.stats['total_packages']}")
        print(f"Vulnerable packages: {self.stats['vulnerable_packages']}")
        print(f"Total vulnerabilities: {self.stats['total_vulnerabilities']}")
        print(f"\nBy Severity:")
        for severity in ["critical", "high", "medium", "low", "info"]:
            count = self.stats['by_severity'].get(severity, 0)
            if count > 0:
                print(f"  - {severity.upper()}: {count}")
        print(f"\nBy Component:")
        for component, count in self.stats['by_component'].items():
            print(f"  - {component}: {count}")
        
        return self._generate_unified_report()
    
    def _generate_unified_report(self) -> Dict:
        """Generate unified SCA report"""
        risk_score = self._calculate_risk_score()
        
        return {
            "scan_metadata": {
                "scan_type": "SCA",
                "tool": "NPM Audit",
                "scan_date": datetime.now().isoformat(),
                "project": "ChronoGaz",
                "parser_version": "1.0.0"
            },
            "summary": {
                "total_packages": self.stats["total_packages"],
                "vulnerable_packages": self.stats["vulnerable_packages"],
                "total_vulnerabilities": self.stats["total_vulnerabilities"],
                "risk_score": risk_score,
                "severity_distribution": dict(self.stats["by_severity"]),
                "component_distribution": dict(self.stats["by_component"])
            },
            "top_vulnerabilities": self._get_top_vulnerabilities(5),
            "vulnerabilities": self.vulnerabilities,
            "statistics": {
                "by_package": dict(self.stats["by_package"]),
                "direct_vs_indirect": self._count_direct_indirect(),
                "fixable_count": self._count_fixable()
            }
        }
    
    def _calculate_risk_score(self) -> float:
        """Calculate overall risk score (0-100)"""
        if self.stats["total_vulnerabilities"] == 0:
            return 0.0
        
        total_weight = sum(
            count * self.SEVERITY_WEIGHTS.get(severity, 1)
            for severity, count in self.stats["by_severity"].items()
        )
        
        # Normalize to 0-100 scale
        max_possible = self.stats["total_vulnerabilities"] * 10
        risk_score = (total_weight / max_possible) * 100 if max_possible > 0 else 0
        
        return round(risk_score, 2)
    
    def _get_top_vulnerabilities(self, limit: int = 5) -> List[Dict]:
        """Get top N most critical vulnerabilities"""
        risk_order = {"critical": 5, "high": 4, "medium": 3, "low": 2, "info": 1}
        
        sorted_vulns = sorted(
            self.vulnerabilities,
            key=lambda v: (
                risk_order.get(v["risk_level"], 0),
                v.get("max_cvss", 0)
            ),
            reverse=True
        )
        
        return sorted_vulns[:limit]
    
    def _count_direct_indirect(self) -> Dict:
        """Count direct vs indirect dependencies"""
        direct = sum(1 for v in self.vulnerabilities if v["is_direct"])
        indirect = len(self.vulnerabilities) - direct
        return {"direct": direct, "indirect": indirect}
    
    def _count_fixable(self) -> int:
        """Count vulnerabilities with fixes available"""
        return sum(1 for v in self.vulnerabilities if v["fix_available"])
    
    def save_report(self, output_path: str = "unified_sca_report.json"):
        """Save unified report to JSON file"""
        report = self._generate_unified_report()
        
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Unified SCA report saved to: {output_file}")
        print(f"   File size: {output_file.stat().st_size / 1024:.2f} KB")


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="SCA Parser - Parse NPM Audit Reports"
    )
    parser.add_argument(
        "-i", "--input-dir",
        default=".",
        help="Directory containing SCA reports"
    )
    parser.add_argument(
        "-o", "--output",
        default="unified_sca_report.json",
        help="Output file path"
    )
    
    args = parser.parse_args()
    
    # Create parser and process reports
    sca_parser = SCAParser(report_dir=args.input_dir)
    report = sca_parser.parse_all_reports()
    sca_parser.save_report(args.output)
    
    # Display key findings
    print("\n" + "=" * 70)
    print("🎯 KEY FINDINGS")
    print("=" * 70)
    
    top_vulns = report["top_vulnerabilities"]
    if top_vulns:
        print(f"\nTop {len(top_vulns)} Critical Vulnerabilities:")
        for i, vuln in enumerate(top_vulns, 1):
            print(f"\n{i}. [{vuln['risk_level'].upper()}] {vuln['package']}")
            print(f"   Component: {vuln['component']} ({vuln['variant']})")
            print(f"   Severity: {vuln['severity']} | CVSS: {vuln['max_cvss']}")
            print(f"   Fix Available: {'Yes' if vuln['fix_available'] else 'No'}")
    else:
        print("\n✅ No vulnerabilities found!")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
