import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from collections import defaultdict


class DASTParser:
    """Parser for OWASP ZAP reports (Dynamic Application Security Testing)"""
    
    # Risk code mapping (ZAP uses 0-3)
    RISK_MAP = {
        "0": "info",
        "1": "low",
        "2": "medium",
        "3": "high"
    }
    
    # Confidence mapping
    CONFIDENCE_MAP = {
        "0": "false_positive",
        "1": "low",
        "2": "medium",
        "3": "high"
    }
    
    # Risk level calculation
    RISK_WEIGHTS = {
        "info": 1,
        "low": 3,
        "medium": 6,
        "high": 10
    }
    
    def __init__(self, report_dir: str = "."):
        """Initialize the DAST parser"""
        self.report_dir = Path(report_dir)
        self.vulnerabilities = []
        self.stats = {
            "total_alerts": 0,
            "total_instances": 0,
            "by_severity": defaultdict(int),
            "by_confidence": defaultdict(int),
            "by_category": defaultdict(int),
            "urls_tested": set()
        }
    
    def parse_zap_report(self, report_path: str) -> List[Dict]:
        """Parse an OWASP ZAP JSON report"""
        vulnerabilities = []
        
        try:
            with open(report_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract metadata
            zap_version = data.get("@version", "unknown")
            scan_date = data.get("@generated", "")
            
            # Parse sites
            sites = data.get("site", [])
            if not isinstance(sites, list):
                sites = [sites]
            
            for site in sites:
                site_name = site.get("@name", "unknown")
                alerts = site.get("alerts", [])
                
                for alert in alerts:
                    vuln = self._normalize_vulnerability(alert, site_name)
                    vulnerabilities.append(vuln)
                    
                    # Update stats
                    self.stats["total_alerts"] += 1
                    instances = alert.get("instances", [])
                    instance_count = len(instances) if isinstance(instances, list) else int(alert.get("count", 1))
                    self.stats["total_instances"] += instance_count
                    self.stats["by_severity"][vuln["severity"]] += 1
                    self.stats["by_confidence"][vuln["confidence"]] += 1
                    
                    # Track URLs
                    for instance in instances if isinstance(instances, list) else []:
                        if "uri" in instance:
                            self.stats["urls_tested"].add(instance["uri"])
            
            print(f"✅ Parsed {report_path}: {len(vulnerabilities)} vulnerabilities found")
            
        except FileNotFoundError:
            print(f"⚠️  Warning: Report not found: {report_path}")
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON in {report_path}: {e}")
        except Exception as e:
            print(f"❌ Unexpected error parsing {report_path}: {e}")
        
        return vulnerabilities
    
    def _normalize_vulnerability(self, alert: Dict, site_name: str) -> Dict:
        """Normalize a ZAP alert into standard format"""
        
        plugin_id = alert.get("pluginid", "unknown")
        alert_ref = alert.get("alertRef", "")
        name = alert.get("alert", alert.get("name", "Unknown"))
        
        risk_code = str(alert.get("riskcode", "1"))
        confidence_code = str(alert.get("confidence", "2"))
        
        severity = self.RISK_MAP.get(risk_code, "low")
        confidence = self.CONFIDENCE_MAP.get(confidence_code, "medium")
        
        # Extract instances
        instances = alert.get("instances", [])
        if not isinstance(instances, list):
            instances = []
        
        instance_count = len(instances) if instances else int(alert.get("count", 1))
        
        # Parse instances details
        affected_urls = []
        for instance in instances[:5]:  # Limit to first 5 for brevity
            affected_urls.append({
                "url": instance.get("uri", ""),
                "method": instance.get("method", ""),
                "param": instance.get("param", ""),
                "evidence": instance.get("evidence", "")[:200]  # Truncate evidence
            })
        
        # CWE and WASC
        cwe_id = alert.get("cweid", "")
        wasc_id = alert.get("wascid", "")
        
        cwe = f"CWE-{cwe_id}" if cwe_id else "CWE-Unknown"
        
        return {
            "id": self._generate_vuln_id(plugin_id, alert_ref),
            "source": "DAST",
            "tool": "OWASP ZAP",
            "site": site_name,
            "plugin_id": plugin_id,
            "alert_ref": alert_ref,
            "name": name,
            "severity": severity,
            "confidence": confidence,
            "risk_level": self._calculate_risk_level(severity, confidence),
            "description": alert.get("desc", "").replace("<p>", "").replace("</p>", "")[:500],
            "solution": alert.get("solution", "").replace("<p>", "").replace("</p>", "")[:500],
            "reference": alert.get("reference", ""),
            "cwe": cwe,
            "wasc": f"WASC-{wasc_id}" if wasc_id else "WASC-Unknown",
            "instance_count": instance_count,
            "affected_urls": affected_urls,
            "owasp_category": self._map_to_owasp(cwe),
            "nist_csf_function": self._map_to_nist_csf(name, cwe)
        }
    
    def _generate_vuln_id(self, plugin_id: str, alert_ref: str) -> str:
        """Generate unique vulnerability ID"""
        import hashlib
        unique_str = f"DAST:{plugin_id}:{alert_ref}"
        hash_obj = hashlib.md5(unique_str.encode())
        return f"DAST-{hash_obj.hexdigest()[:8].upper()}"
    
    def _calculate_risk_level(self, severity: str, confidence: str) -> str:
        """Calculate risk level based on severity and confidence"""
        if severity == "high" and confidence == "high":
            return "critical"
        elif severity == "high":
            return "high"
        elif severity == "medium" and confidence == "high":
            return "high"
        elif severity == "medium":
            return "medium"
        else:
            return "low"
    
    def _map_to_owasp(self, cwe: str) -> str:
        """Map CWE to OWASP Top 10 category"""
        cwe_to_owasp = {
            "CWE-16": "A05:2021 - Security Misconfiguration",
            "CWE-79": "A03:2021 - Injection (XSS)",
            "CWE-89": "A03:2021 - Injection (SQL)",
            "CWE-200": "A01:2021 - Broken Access Control",
            "CWE-209": "A04:2021 - Insecure Design",
            "CWE-311": "A02:2021 - Cryptographic Failures",
            "CWE-319": "A02:2021 - Cryptographic Failures",
            "CWE-352": "A01:2021 - Broken Access Control (CSRF)",
            "CWE-548": "A05:2021 - Security Misconfiguration",
            "CWE-693": "A05:2021 - Security Misconfiguration",
            "CWE-732": "A01:2021 - Broken Access Control",
            "CWE-829": "A08:2021 - Software and Data Integrity Failures",
            "CWE-1275": "A05:2021 - Security Misconfiguration",
        }
        
        return cwe_to_owasp.get(cwe, "A05:2021 - Security Misconfiguration")
    
    def _map_to_nist_csf(self, alert_name: str, cwe: str) -> str:
        """Map to NIST Cybersecurity Framework"""
        alert_lower = alert_name.lower()
        
        if "csp" in alert_lower or "header" in alert_lower:
            return "PR.DS - Data Security"
        elif "cors" in alert_lower or "cross" in alert_lower:
            return "PR.AC - Access Control"
        elif "cookie" in alert_lower:
            return "PR.DS - Data Security"
        elif "xss" in alert_lower or "injection" in alert_lower:
            return "DE.CM - Security Monitoring"
        elif "disclosure" in alert_lower or "information" in alert_lower:
            return "PR.DS - Data Security"
        else:
            return "PR.IP - Information Protection Processes"
    
    def parse_all_reports(self) -> Dict:
        """Parse all DAST reports"""
        print("=" * 70)
        print("🔍 DAST PARSER - OWASP ZAP Analysis")
        print("=" * 70)
        
        # Try to find ZAP report
        possible_names = [
            "report_json.json",
            "zap-report.json",
            "dast-report.json"
        ]
        
        for filename in possible_names:
            report_path = self.report_dir / filename
            if report_path.exists():
                vulns = self.parse_zap_report(str(report_path))
                self.vulnerabilities.extend(vulns)
                break
        
        print("\n" + "=" * 70)
        print("📊 PARSING SUMMARY")
        print("=" * 70)
        print(f"Total alerts: {self.stats['total_alerts']}")
        print(f"Total instances: {self.stats['total_instances']}")
        print(f"URLs tested: {len(self.stats['urls_tested'])}")
        print(f"\nBy Severity:")
        for severity in ["high", "medium", "low", "info"]:
            count = self.stats['by_severity'].get(severity, 0)
            if count > 0:
                print(f"  - {severity.upper()}: {count}")
        
        return self._generate_unified_report()
    
    def _generate_unified_report(self) -> Dict:
        """Generate unified DAST report"""
        risk_score = self._calculate_risk_score()
        
        return {
            "scan_metadata": {
                "scan_type": "DAST",
                "tool": "OWASP ZAP",
                "scan_date": datetime.now().isoformat(),
                "project": "ChronoGaz",
                "parser_version": "1.0.0"
            },
            "summary": {
                "total_alerts": self.stats["total_alerts"],
                "total_instances": self.stats["total_instances"],
                "urls_tested": len(self.stats["urls_tested"]),
                "risk_score": risk_score,
                "severity_distribution": dict(self.stats["by_severity"]),
                "confidence_distribution": dict(self.stats["by_confidence"])
            },
            "top_vulnerabilities": self._get_top_vulnerabilities(5),
            "vulnerabilities": self.vulnerabilities,
            "statistics": {
                "by_category": self._categorize_vulnerabilities(),
                "urls_tested": list(self.stats["urls_tested"])[:20]  # Limit to 20
            }
        }
    
    def _calculate_risk_score(self) -> float:
        """Calculate overall risk score (0-100)"""
        if self.stats["total_alerts"] == 0:
            return 0.0
        
        total_weight = sum(
            count * self.RISK_WEIGHTS.get(severity, 1)
            for severity, count in self.stats["by_severity"].items()
        )
        
        # Normalize to 0-100 scale
        max_possible = self.stats["total_alerts"] * 10
        risk_score = (total_weight / max_possible) * 100 if max_possible > 0 else 0
        
        return round(risk_score, 2)
    
    def _get_top_vulnerabilities(self, limit: int = 5) -> List[Dict]:
        """Get top N most critical vulnerabilities"""
        risk_order = {"critical": 5, "high": 4, "medium": 3, "low": 2, "info": 1}
        
        sorted_vulns = sorted(
            self.vulnerabilities,
            key=lambda v: (
                risk_order.get(v["risk_level"], 0),
                v["instance_count"]
            ),
            reverse=True
        )
        
        return sorted_vulns[:limit]
    
    def _categorize_vulnerabilities(self) -> Dict:
        """Categorize vulnerabilities by type"""
        categories = defaultdict(int)
        
        for vuln in self.vulnerabilities:
            name = vuln["name"].lower()
            
            if "csp" in name or "content security" in name:
                categories["Content Security Policy"] += 1
            elif "cors" in name or "cross" in name:
                categories["CORS Misconfiguration"] += 1
            elif "cookie" in name:
                categories["Cookie Security"] += 1
            elif "xss" in name:
                categories["Cross-Site Scripting"] += 1
            elif "injection" in name or "sql" in name:
                categories["Injection"] += 1
            elif "header" in name:
                categories["Missing Security Headers"] += 1
            elif "disclosure" in name or "information" in name:
                categories["Information Disclosure"] += 1
            else:
                categories["Other"] += 1
        
        return dict(categories)
    
    def save_report(self, output_path: str = "unified_dast_report.json"):
        """Save unified report to JSON file"""
        report = self._generate_unified_report()
        
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Unified DAST report saved to: {output_file}")
        print(f"   File size: {output_file.stat().st_size / 1024:.2f} KB")


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="DAST Parser - Parse OWASP ZAP Reports"
    )
    parser.add_argument(
        "-i", "--input-dir",
        default=".",
        help="Directory containing DAST reports"
    )
    parser.add_argument(
        "-o", "--output",
        default="unified_dast_report.json",
        help="Output file path"
    )
    
    args = parser.parse_args()
    
    # Create parser and process reports
    dast_parser = DASTParser(report_dir=args.input_dir)
    report = dast_parser.parse_all_reports()
    dast_parser.save_report(args.output)
    
    # Display key findings
    print("\n" + "=" * 70)
    print("🎯 KEY FINDINGS")
    print("=" * 70)
    
    top_vulns = report["top_vulnerabilities"]
    if top_vulns:
        print(f"\nTop {len(top_vulns)} Critical Vulnerabilities:")
        for i, vuln in enumerate(top_vulns, 1):
            print(f"\n{i}. [{vuln['risk_level'].upper()}] {vuln['name']}")
            print(f"   Instances: {vuln['instance_count']}")
            print(f"   Confidence: {vuln['confidence']}")
            print(f"   CWE: {vuln['cwe']} | OWASP: {vuln['owasp_category']}")
    else:
        print("\n✅ No vulnerabilities found!")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()