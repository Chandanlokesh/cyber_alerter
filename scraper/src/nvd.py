# Return the whole json file based on:
# CVE ID (Apperently)

import requests

# TODO: handle dynamic url
BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0/"


class NVDScrap:
    '''
    :Input: This class scrap the nvd site
    :Output: Returns a dictionary
    '''

    def __init__(self, cve_id):
        self.cve_id = cve_id

    def scrap(self):
        # TODO: handle the error during fetch
        r = requests.get(f"{BASE_URL}?cveid={self.cve_id}")
        return r.json()
    
    @staticmethod
    def takeInput():
        cveID = input("Enter a CVE ID: ")
        return NVDScrap(cveID)
