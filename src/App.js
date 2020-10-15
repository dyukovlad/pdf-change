import React, { useRef, useEffect, useState } from "react";
//import { useDropzone } from "react-dropzone";
import WebViewer from "@pdftron/webviewer";

import "./App.css";

let web;
function App() {
  const viewer = useRef(null);

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
    console.log("files", files);

    if (files.length < 2) {
      return;
    }

    /*       if (Object.keys(files).length > 0) {
        instance.loadDocument(files, { filename: files.name });
      } */

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

  return (
    <div className="MyComponent">
      <div className="MyComponent__sidebar">
        <div>
          <div>
            Файл 1
            <label className="custom-file-upload">
              <input type="file" onChange={uploadFile} />
            </label>
          </div>

          <div>
            Файл 2
            <label className="custom-file-upload">
              <input type="file" onChange={uploadFile} />
            </label>
          </div>

          <button onClick={diff}>Сравнить</button>
        </div>
      </div>

      <div className="webviewer" ref={viewer} />
    </div>
  );
}

export default App;
