/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import Diagnostics from './pages/Diagnostics';
import Directory from './pages/Directory';
import EducationalRounds from './pages/EducationalRounds';
import Home from './pages/Home';
import JournalClub from './pages/JournalClub';
import JournalDetail from './pages/JournalDetail';
import MyWorkspace from './pages/MyWorkspace';
import OnCall from './pages/OnCall';
import OnCallDetail from './pages/OnCallDetail';
import PatientCare from './pages/PatientCare';
import Pharmacy from './pages/Pharmacy';
import Resources from './pages/Resources';
import ServiceBoard from './pages/ServiceBoard';
import ServiceDetail from './pages/ServiceDetail';
import Services from './pages/Services';
import SurgicalLog from './pages/SurgicalLog';
import Transfers from './pages/Transfers';
import WoundCare from './pages/WoundCare';
import WoundCaseDetail from './pages/WoundCaseDetail';
import StudentSchedule from './pages/StudentSchedule';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Diagnostics": Diagnostics,
    "Directory": Directory,
    "EducationalRounds": EducationalRounds,
    "Home": Home,
    "JournalClub": JournalClub,
    "JournalDetail": JournalDetail,
    "MyWorkspace": MyWorkspace,
    "OnCall": OnCall,
    "OnCallDetail": OnCallDetail,
    "PatientCare": PatientCare,
    "Pharmacy": Pharmacy,
    "Resources": Resources,
    "ServiceBoard": ServiceBoard,
    "ServiceDetail": ServiceDetail,
    "Services": Services,
    "SurgicalLog": SurgicalLog,
    "Transfers": Transfers,
    "WoundCare": WoundCare,
    "WoundCaseDetail": WoundCaseDetail,
    "StudentSchedule": StudentSchedule,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};