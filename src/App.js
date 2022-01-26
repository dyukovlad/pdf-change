import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import Sidebar from 'react-sidebar';

import './App.css';

let web;
function App() {
  const viewer = useRef(null);

  const [files, setFiles] = useState([]);
  const [openBar, setOpenBar] = useState(false);

  useEffect(() => {
    web = WebViewer(
      {
        path: 'lib',
        // pdftronServer: "https://pdftronsrv.microservice.aniklab.com/",
        showLocalFilePicker: true,
        fullAPI: true,
        licenseKey: null,
        enableRedaction: true,
      },
      viewer.current
    );
    web.then(async (instance) => {
      const { docViewer } = instance;
      instance.setLanguage('ru');

      instance.setHeaderItems((header) => {
        header.push({
          type: 'actionButton',
          img: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"></path><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path></svg>',
          onClick: () => {
            // save the annotations
            setOpenBar(!openBar);
          },
        });
      });

      docViewer.on('documentLoaded', () => {
        // perform document operations
        console.log('object loaded');
        instance.openElements(['leftPanel']);
        instance.setActiveLeftPanel('layersPanel');
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = (e) => {
    let file = e.target.files;
    setFiles([...files, ...file]);
  };

  const diff = () => {
    if (files.length < 2) {
      return;
    }

    web.then(async (instance) => {
      const { PDFNet, CoreControls } = instance;

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
    });
  };

  const del = () => {
    setFiles([]);
  };

  const onSetSidebarOpen = () => {
    setOpenBar(!openBar);
  };

  /*   const open = () => {
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
  }; */

  return (
    <div className="MyComponent">
      <Sidebar
        sidebar={
          <div className="MyComponent__sidebar">
            <h3>Дополнительные функции</h3>

            <div className="collapsible">Сравнение 2х файлов</div>

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
          </div>
        }
        open={openBar}
        onSetOpen={onSetSidebarOpen}
        styles={{ sidebar: { background: 'white' } }}
      >
        <div className="webviewer" ref={viewer} />
      </Sidebar>
    </div>
  );
}

export default App;
