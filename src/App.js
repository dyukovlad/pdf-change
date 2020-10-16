import React, { useRef, useEffect, useState } from "react";
//import { useDropzone } from "react-dropzone";
import WebViewer from "@pdftron/webviewer";
import Collapse from "@kunukn/react-collapse";

import "./App.css";

let web;
function App() {
  const viewer = useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const [files, setFiles] = useState([]);

  /*   const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setFiles(file);
      };
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop }); */

  useEffect(() => {
    web = WebViewer(
      {
        path: "lib",
        pdftronServer: "http://192.168.88.254:8090/",
        showLocalFilePicker: true,
        fullAPI: true,
        licenseKey: null,
      },
      viewer.current
    );
    web.then((instance) => instance.setLanguage("ru"));
  }, []);

  const uploadFile = (e) => {
    let file = e.target.files;
    /* let filesArr = Array.prototype.slice.call(file); */
    setFiles([...files, ...file]);
  };

  const diff = () => {
    if (files.length < 2) {
      return;
    }

    web.then(async (instance) => {
      const { PDFNet, CoreControls /* docViewer */ } = instance;

      await PDFNet.initialize();

      const getDocument = async (url) => {
        const newDoc = await CoreControls.createDocument(url);
        return await newDoc.getPDFDoc();
      };

      const [doc1, doc2] = await Promise.all([
        getDocument(files[0]),
        getDocument(files[1]),
      ]);

      const getPageArray = async (doc) => {
        const arr = [];
        const itr = await doc.getPageIterator(1);

        for (itr; await itr.hasNext(); itr.next()) {
          const page = await itr.current();
          arr.push(page);
        }

        return arr;
      };

      const [doc1Pages, doc2Pages] = await Promise.all([
        getPageArray(doc1),
        getPageArray(doc2),
      ]);

      const newDoc = await PDFNet.PDFDoc.create();
      newDoc.lock();

      const biggestLength = Math.max(doc1Pages.length, doc2Pages.length);

      const chain = Promise.resolve();

      for (let i = 0; i < biggestLength; i++) {
        chain.then(async () => {
          let page1 = doc1Pages[i];
          let page2 = doc2Pages[i];

          // handle the case where one document has more pages than the other
          if (!page1) {
            page1 = new PDFNet.Page(0); // create a blank page
          }
          if (!page2) {
            page2 = new PDFNet.Page(0); // create a blank page
          }
          return newDoc.appendVisualDiff(page1, page2, null);
        });
      }

      await chain;
      newDoc.unlock();

      instance.loadDocument(newDoc);

      //  docViewer.on("documentLoaded", () => {});
    });
  };

  const del = () => {
    setFiles([]);
  };

  const open = () => {
    if (files.length < 1) {
      return;
    }
    web.then(async (instance) => {
      const { docViewer } = instance;
      instance.loadDocument(files[0], { filename: files[0].name });
      instance.openElements(["leftPanel"]);
      instance.setActiveLeftPanel("layersPanel");
      docViewer.on("pageComplete", () => {
        instance.closeElements(["loadingModal"]);
      });
    });
  };

  return (
    <div className="MyComponent">
      <div className="MyComponent__sidebar">
        <h3>Дополнительные функции</h3>

        <div>Открыть файл</div>
        <div>
          <div>
            <label className="custom-file-upload">
              <input type="file" onChange={uploadFile} />
              Файл
            </label>
            <br />
            {files[0]?.name}
          </div>

          <button onClick={open}>Открыть</button>
          <button onClick={del}>Удалить</button>
        </div>

        <div
          className="collapsible"
          onClick={() => setIsOpen((state) => !state)}
        >
          Сравнение 2х файлов
        </div>
        <Collapse isOpen={isOpen}>
          <div>
            <div>
              <label className="custom-file-upload">
                <input type="file" onChange={uploadFile} />
                Файл 1
              </label>
              {files[0]?.name}
            </div>

            <div>
              <label className="custom-file-upload">
                <input type="file" onChange={uploadFile} />
                Файл 2
              </label>
              {files[1]?.name}
            </div>

            <button onClick={diff}>Сравнить</button>
            <button onClick={del}>Удалить</button>
          </div>
        </Collapse>
      </div>

      <div className="webviewer" ref={viewer} />
    </div>
  );
}

export default App;
