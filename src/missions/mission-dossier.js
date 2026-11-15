import {renderDossierTab as renderFrench} from './mission-dossier-fr.js';
import {renderDossierTab} from './mission-dossier-content.js';
import {mountDossier} from './dossier-experience.js';
mountDossier({renderTab:(id,language)=>language==='fr'?renderFrench(id):renderDossierTab(id)});
