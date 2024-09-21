from src.nvd import NVDScrap

def main():
    fetchNVD = NVDScrap.takeInput()
    print(fetchNVD.scrap())

if __name__ == "__main__":
    main()