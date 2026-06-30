import { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  youtubeUrls: string[];
  setYoutubeUrls: React.Dispatch<React.SetStateAction<string[]>>;
  materialsReady: boolean;
  setMaterialsReady: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [materialsReady, setMaterialsReady] = useState(false);

  return (
    <AppContext.Provider value={{
      uploadedFiles, setUploadedFiles,
      youtubeUrls, setYoutubeUrls,
      materialsReady, setMaterialsReady
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};