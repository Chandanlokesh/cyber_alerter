from src.nvd import NVDScrap

def main():
    fetchNVD = NVDScrap()
    print(fetchNVD.scrap())

if __name__ == "__main__":
    main()