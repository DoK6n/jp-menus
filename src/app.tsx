import { menuLibrary } from "./data/catalogs";
import { StudyPage } from "./features/study/view";

export function App() {
  return <StudyPage library={menuLibrary} />;
}
