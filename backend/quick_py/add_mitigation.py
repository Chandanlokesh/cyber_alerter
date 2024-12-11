import json
import os
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import asyncio
from monitor_nvd import QuickScan

load_dotenv()


class Adding_Mitigation():

    __api_key = os.getenv("NVIDIA_NEMOTRON_API_KEY")
    __base_url = "https://integrate.api.nvidia.com/v1"

    def __init__(self, raw_data: any, product_name: str, top_n=10):
        self.client = OpenAI(
            base_url=self.__base_url,
            api_key=self.__api_key
        )
        self.raw_data = raw_data
        self.product_name = product_name
        self.top_n = top_n
    def get_recent_cves(self):
        """
        Filters and retrieves the top N recent CVEs for the specified product.
        """
        sorted_cves = sorted(
            self.raw_data,
            key=lambda x: datetime.fromisoformat(x["published_date"]),
            reverse=True
        )
        # Extract the top N CVEs
        recent_cves = sorted_cves[:self.top_n]
        return recent_cves

    def llm_model(self, prompt):
        """
        Calls the LLM model with the given prompt and returns the response.
        """
        try:
            completion = self.client.chat.completions.create(
                model="nvidia/llama-3.1-nemotron-70b-instruct",
                messages=[{"role": "system", "content": "you are a cybersecurity expert"},
                          {"role": "user", "content": prompt}],
                temperature=0.7,
                top_p=1,
                max_tokens=100,
                stream=True
            )
            response_text = ""
            for chunk in completion:
                if chunk.choices[0].delta.content is not None:
                    response_text += chunk.choices[0].delta.content
            return response_text.strip()
        except Exception as e:
            print(f"Error while calling LLM model: {e}")
            return ""

    def find_mitigation(self, cve_id):
        """
        Generates a mitigation strategy for the given CVE ID using the LLM model.
        """
        prompt = f"""
        CVE ID: {cve_id}
        give me the mitigation strategy only these things without unnecessary information. give the response in 30-40 words.
        response:
        """
        return self.llm_model(prompt)

    def extract_all_cve_ids(self,recent_cve):
        """
        Extracts all CVE IDs from the given data.
        """
        cve_ids = [item['cve_id'] for item in recent_cve if 'cve_id' in item]
        #print(cve_ids)
        return cve_ids

    async def process_file(self, file_path, product_name, top_n, output_file):
        """
        Processes the specified file to add mitigation strategies and save the output.
        """
        # Open and read the entire file
        # with open(file_path, 'r', encoding="utf-8") as file:
        #self.raw_data = json.load(file)

        recent_cves = self.get_recent_cves()
        #print(recent_cves)
        extracted_cve_ids = self.extract_all_cve_ids(recent_cves)

        for index, cve_id in enumerate(extracted_cve_ids):
            print(f"Processing CVE ID: {cve_id}")
            mitigation = self.find_mitigation(cve_id)

            lines = mitigation.splitlines()
            strategy = [line.strip("* ").strip() for line in lines[1:]]
            json_mitigation = {
                "details": strategy
            }

            if isinstance(recent_cves[index], dict):
                recent_cves[index]["mitigation strategy"] = json_mitigation

        # returning the updated data to the output file
        with open("add_mitigation.json", "w", encoding="utf-8") as file:
            json.dump(recent_cves, file, indent=4)

            print(f"Output saved")
        # output_file = "add_mitigation1.json"
        # with open(output_file, "w", encoding="utf-8") as file:
        #     json.dump(recent_cves, file, indent=4) 
        return recent_cves

# Example usage
async def main():
    product_name = "Open SSH"
    runScan = QuickScan(product_name=product_name)
    file_path = await runScan.parse_formatted_data()  
    #print(file_path)
    top_n = 10
    output_file = "added_mitigation.json"
    # api_key = os.getenv("NVIDIA_NEMOTRON_API_KEY")
    mitigation_processor = Adding_Mitigation(product_name=product_name, raw_data=file_path)
    await mitigation_processor.process_file(file_path, product_name, top_n, output_file)



    

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


if __name__ == "__main__":
        asyncio.run(main())
