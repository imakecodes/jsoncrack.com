import React from "react";
import styled from "styled-components";
import Editor, { loader, Monaco, useMonaco } from "@monaco-editor/react";
import { Loading } from "src/layout/Loading";
import useFile from "src/store/useFile";
import useStored from "src/store/useStored";
import { CarbonAds } from "../CarbonAds";

loader.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.0/min/vs",
  },
});

const editorOptions = {
  formatOnPaste: true,
  formatOnType: true,
  minimap: {
    enabled: false,
  },
};

const StyledWrapper = styled.div`
  display: grid;
  height: calc(100vh - 63px);
  grid-template-columns: 100%;
  grid-template-rows: minmax(0, 1fr);
`;

export const MonacoEditor = () => {
  const monaco = useMonaco();
  const contents = useFile(state => state.contents);
  const setContents = useFile(state => state.setContents);
  const setError = useFile(state => state.setError);
  const jsonSchema = useFile(state => state.jsonSchema);
  const getHasChanges = useFile(state => state.getHasChanges);
  const theme = useStored(state => (state.lightmode ? "light" : "vs-dark"));

  React.useEffect(() => {
    if (monaco) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        ...(jsonSchema && {
          schemas: [
            {
              fileMatch: ["*"],
              schema: jsonSchema,
            },
          ],
        }),
      });
    }
  }, [jsonSchema, monaco]);

  const handleEditorWillMount = React.useCallback(
    (monaco: Monaco) => {
      monaco.editor.onDidChangeMarkers(([uri]) => {
        const markers = monaco.editor.getModelMarkers({ resource: uri });
        setError(markers.length);
      });
    },
    [setError]
  );

  React.useEffect(() => {
    const beforeunload = (e: BeforeUnloadEvent) => {
      if (getHasChanges()) {
        const confirmationMessage =
          "Unsaved changes, if you leave before saving  your changes will be lost";

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage;
      }
    };

    window.addEventListener("beforeunload", beforeunload);

    return () => {
      window.removeEventListener("beforeunload", beforeunload);
    };
  }, [getHasChanges]);

  return (
    <StyledWrapper>
      <Editor
        value={contents}
        theme={theme}
        options={editorOptions}
        onChange={contents => setContents({ contents, skipUpdate: true })}
        loading={<Loading message="Loading Editor..." />}
        beforeMount={handleEditorWillMount}
        language="json"
        height="100%"
      />
      <CarbonAds />
    </StyledWrapper>
  );
};
