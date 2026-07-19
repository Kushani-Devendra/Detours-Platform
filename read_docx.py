import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(path):
    with zipfile.ZipFile(path) as docx:
        xml_content = docx.read('word/document.xml')
        tree = ET.XML(xml_content)
        
        # The namespace for WordprocessingML
        WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        PARA = WORD_NAMESPACE + 'p'
        TEXT = WORD_NAMESPACE + 't'
        
        paragraphs = []
        for paragraph in tree.iter(PARA):
            texts = [node.text for node in paragraph.iter(TEXT) if node.text]
            if texts:
                paragraphs.append(''.join(texts))
            else:
                paragraphs.append('') # keep empty lines for structure
                
        return '\n'.join(paragraphs)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        text = read_docx(sys.argv[1])
        # Find section 5
        lines = text.split('\n')
        recording = False
        section5_content = []
        for line in lines:
            if "5." in line and "ROOM PREFERENCES" in line.upper():
                recording = True
            elif recording and line.strip().startswith("6."):
                break
            
            if recording:
                section5_content.append(line)
                
        print('\n'.join(section5_content))
    else:
        print("Provide docx path")
