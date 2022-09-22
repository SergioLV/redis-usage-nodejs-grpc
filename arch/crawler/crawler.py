from cmath import log
from bs4 import BeautifulSoup
import re
import urllib3
import logging

def getTitle(html):
    """Scrape page title."""
    title = None
    try:
        if html.title.string:
            title = html.title.string
        elif html.find("meta", property="og:title"):
            title = html.find("meta", property="og:title").get('content')
        elif html.find("meta", property="twitter:title"):
            title = html.find("meta", property="twitter:title").get('content')
        elif html.find("h1"):
            title = html.find("h1").string
        if title != None:
            logging.info("title found: " + title)
    except Exception as e:
        logging.error(e)
    return title

def getDescription(html):
    """Scrape page description."""
    description = None
    try:
        if html.find("meta", property="description"):
            description = html.find("meta", property="description").get('content')
        elif html.find("meta", property="og:description"):
            description = html.find("meta", property="og:description").get('content')
        elif html.find("meta", property="twitter:description"):
            description = html.find("meta", property="twitter:description").get('content')
        elif html.find("p"):
            description = html.find("p").contents
        if description != None:
            logging.info("description found: " + description)
    except Exception as e:
        logging.error(e)
    return description

def getKeywords(html):
    """Scrape page description."""
    keywords = None
    try:
        if html.find("meta", property="keywords"):
            keywords = html.find("meta", property="keywords").get('content')
        elif html.find("meta", property="og:keywords"):
            keywords = html.find("meta", property="og:keywords").get('content')
        elif html.find("meta", property="twitter:keywords"):
            keywords = html.find("meta", property="twitter:keywords").get('content')
        elif html.find_all('meta',attrs={'name':'keywords'}):
            keywords = html.find_all('meta',attrs={'name':'keywords'})[0].get('content')
        if keywords != None:
            logging.info("keywords found: " + keywords)
    except Exception as e:
        logging.error(e)
    return keywords

def getUrlFromLine(line):
    regex = r"(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’]))"
    url = re.findall(regex, line)      
    return [x[0] for x in url]

def retreiveUrlsFromDataset(url):
    urls = []
    with open(url) as file:
        for line in file:
            url = getUrlFromLine(line)
            if url != []:
                urls.append(url[0])
    return urls

def retreiveDataFromUrl(url):

    http = urllib3.PoolManager()
    try:
        response = http.request('GET', url)
        if response.status != 200:
            return []
    except:
        return []
    soup = BeautifulSoup(response.data, 'html.parser')
    title = getTitle(soup.head)
    description = getDescription(soup.head)
    keywords = getKeywords(soup.head)
    if keywords == None:
        return []
    return [title, description, keywords, url]

def generate_sql(urls, count):
    with open("C:\\Users\\Checho\\Downloads\\udp\\2022-2\\sistemas distribuidos\\sistemas-distribuidos-t1\\arch\\db\\crawler_output.sql", "w") as file:
        id = 0
        file.write("CREATE TABLE IF NOT EXISTS websites(id INT,title VARCHAR(255), description VARCHAR(800), keywords TEXT [], url VARCHAR(255) NOT NULL);\n")
        
        for url in urls:
            data = retreiveDataFromUrl(url)
            if id == count:                
                break
            if data != []: 
                aux = toQuery(data[2].split(','))
                print("///////////////////////////////////////////////////////////////////////////////////////////")
                print(str(id)+"/"+str(count))
                print("///////////////////////////////////////////////////////////////////////////////////////////")
                id += 1
                insert = "INSERT INTO websites (id,title,description,keywords, url) VALUES(%s,\'%s\', \'%s\', ARRAY[%s], \'%s\');" % (id, data[0], data[1], aux, data[3])
                file.write(insert)
                file.write("\n")
    return data

def toQuery(array):
    response = ''
    for item in array:
        response += "'%s'," % (item.strip())
    return response[:-1]


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    url = "C:\\Users\\Checho\\Downloads\\udp\\2022-2\\sistemas distribuidos\\sistemas-distribuidos-t1\\arch\\data\\132_lines_dump.txt"     
    urls = retreiveUrlsFromDataset(url)
    generate_sql(urls, 5)


