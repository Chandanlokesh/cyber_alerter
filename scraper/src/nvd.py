import requests

# TODO: handle dynamic url
URL = "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2019-1010218"


class NVDScrap:
    '''
    :Input: This class scrap the nvd site
    :Output: Returns a dictionary
    '''
    def scrap(self, url=URL):
        # TODO: handle the error during fetch
        r = requests.get(url)
        content = r.json()

        return {
            "cve_id": content["vulnerabilities"][0]["cve"]["id"],
            "cve_description": content["vulnerabilities"][0]["cve"]["descriptions"][0]["value"],
            "severity": content["vulnerabilities"][0]["cve"]["metrics"]["cvssMetricV31"][0]["cvssData"]["baseSeverity"]
        }
