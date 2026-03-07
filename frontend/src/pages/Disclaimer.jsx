import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Disclaimer() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
    window.scrollTo(0, 0);
  }, [theme]);

  const Section = ({ icon, title, children }) => (
    <div
      className={`rounded-4 overflow-hidden mb-4 ${isDark ? "bg-dark border border-secondary" : "bg-white border"}`}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />
      <div className="p-3 p-md-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(25,135,84,0.10)" }}
          >
            <i className={`bi ${icon} text-success`} style={{ fontSize: "1rem" }} />
          </div>
          <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>{title}</h5>
        </div>
        <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.88rem", lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  );

  const Item = ({ children }) => (
    <div className="d-flex gap-2 mb-2">
      <i className="bi bi-dot text-success flex-shrink-0" style={{ fontSize: "1.2rem", marginTop: "-2px" }} />
      <span>{children}</span>
    </div>
  );

  return (
    <div className={isDark ? "bg-dark text-light" : "bg-light text-dark"} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header isDark={isDark} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />

      <main className="py-4 py-md-5" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: 800 }}>

          {/* En-tête */}
          <div className="text-center mb-5">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 64, height: 64, background: "rgba(25,135,84,0.10)" }}
            >
              <i className="bi bi-shield-check text-success" style={{ fontSize: "1.8rem" }} />
            </div>
            <h1 className="fw-bold mb-2" style={{ fontSize: "1.6rem" }}>Avis de non-responsabilité</h1>
            <p className={`mb-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.88rem" }}>
              Dernière mise à jour : mars 2025
            </p>
            <div
              className={`d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 mt-2 ${isDark ? "bg-dark border border-secondary" : "bg-success-subtle"}`}
              style={{ fontSize: "0.8rem" }}
            >
              <i className="bi bi-info-circle text-success" />
              <span className={isDark ? "text-secondary" : "text-success"}>
                En utilisant CampusRide, vous acceptez les conditions décrites ci-dessous.
              </span>
            </div>
          </div>

          {/* 1. Nature du service */}
          <Section icon="bi-app" title="1. Nature du service">
            <p>
              CampusRide est une <strong>plateforme de mise en relation</strong> entre conducteurs et passagers membres de la communauté du Collège La Cité. CampusRide n'est pas une entreprise de transport, n'est pas un service de taxi, et n'est pas affiliée à Uber, Lyft ou tout autre service de transport rémunéré.
            </p>
            <Item>CampusRide agit uniquement comme intermédiaire entre les utilisateurs.</Item>
            <Item>Les trajets sont organisés entre particuliers, de façon volontaire et gratuite.</Item>
            <Item>Aucun paiement ne transite par la plateforme.</Item>
          </Section>

          {/* 2. Responsabilité accidents */}
          <Section icon="bi-car-front" title="2. Accidents et incidents de la route">
            <p>
              CampusRide <strong>n'assume aucune responsabilité</strong> pour tout accident, blessure corporelle, dommage matériel ou perte survenant avant, pendant ou après un trajet organisé via la plateforme.
            </p>
            <Item>Le conducteur est seul responsable de la conduite de son véhicule et du respect du Code de la route.</Item>
            <Item>En cas d'accident, le conducteur doit contacter les services d'urgence (911) et son assureur immédiatement.</Item>
            <Item>CampusRide ne prend pas en charge les frais médicaux, les réparations de véhicule, ni aucun autre dommage résultant d'un incident routier.</Item>
            <Item>Les passagers voyagent à leurs propres risques et sous leur entière responsabilité.</Item>
          </Section>

          {/* 3. Assurance */}
          <Section icon="bi-file-earmark-text" title="3. Assurance du véhicule">
            <p>
              Il est de la <strong>responsabilité exclusive du conducteur</strong> de s'assurer que son véhicule est valablement assuré pour le transport de passagers.
            </p>
            <Item>Certaines polices d'assurance automobile standard ne couvrent pas le transport de passagers dans le cadre du covoiturage. Le conducteur doit vérifier sa couverture auprès de son assureur.</Item>
            <Item>CampusRide ne fournit aucune assurance supplémentaire aux conducteurs ni aux passagers.</Item>
            <Item>En cas de doute, le conducteur doit contacter son assureur avant de proposer des trajets.</Item>
          </Section>

          {/* 4. Comportement des utilisateurs */}
          <Section icon="bi-people" title="4. Comportement des utilisateurs">
            <p>
              CampusRide s'engage à maintenir un environnement sûr et respectueux, mais ne peut pas garantir le comportement de ses utilisateurs.
            </p>
            <Item>Tout utilisateur signalé pour comportement inapproprié, harcèlement ou violence peut être suspendu ou banni définitivement de la plateforme.</Item>
            <Item>Les utilisateurs sont encouragés à signaler tout comportement suspect via le système de signalement intégré.</Item>
            <Item>CampusRide se réserve le droit de transmettre les informations d'un utilisateur aux autorités compétentes en cas de situation grave.</Item>
            <Item>Le covoiturage implique une confiance mutuelle — chaque utilisateur est responsable de son comportement envers les autres.</Item>
          </Section>

          {/* 5. Vérification des utilisateurs */}
          <Section icon="bi-person-check" title="5. Vérification des utilisateurs">
            <p>
              L'accès à CampusRide est restreint aux personnes possédant un courriel institutionnel valide du Collège La Cité (<strong>@lacite.on.ca</strong> ou <strong>@collegelacite.ca</strong>). Cependant :
            </p>
            <Item>CampusRide ne vérifie pas le permis de conduire, le dossier de conduite, ni le casier judiciaire des conducteurs.</Item>
            <Item>CampusRide ne vérifie pas l'état mécanique des véhicules.</Item>
            <Item>La vérification par courriel institutionnel réduit les risques mais ne garantit pas l'identité complète de l'utilisateur.</Item>
            <Item>Les utilisateurs sont invités à consulter les évaluations et avis laissés par d'autres membres avant de réserver un trajet.</Item>
          </Section>

          {/* 6. Urgences */}
          <Section icon="bi-telephone-fill" title="6. Situations d'urgence">
            <p>
              En cas d'urgence ou de danger immédiat durant un trajet :
            </p>
            <div
              className="rounded-3 p-3 mb-3 d-flex align-items-center gap-3"
              style={{ background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.2)" }}
            >
              <i className="bi bi-telephone-fill text-danger" style={{ fontSize: "1.5rem", flexShrink: 0 }} />
              <div>
                <div className="fw-bold" style={{ color: "#dc3545" }}>Composez le 911 immédiatement</div>
                <div style={{ fontSize: "0.82rem", color: "#dc3545", opacity: 0.8 }}>Police · Ambulance · Pompiers</div>
              </div>
            </div>
            <Item>CampusRide n'est pas un service d'urgence et ne peut pas intervenir en temps réel lors d'un incident.</Item>
            <Item>En cas de malaise du conducteur, le passager doit demander l'arrêt immédiat du véhicule en lieu sûr et appeler le 911.</Item>
            <Item>En cas de panne mécanique, les passagers ne sont pas tenus de rester dans le véhicule si la sécurité est compromise.</Item>
            <Item>Informez toujours un proche de vos déplacements — partagez votre trajet avec une personne de confiance.</Item>
          </Section>

          {/* 7. Données personnelles */}
          <Section icon="bi-lock" title="7. Données personnelles et confidentialité">
            <p>
              CampusRide collecte et utilise vos données personnelles uniquement dans le cadre du fonctionnement de la plateforme.
            </p>
            <Item>Votre nom, courriel et photo de profil sont visibles par les autres utilisateurs lors des interactions de covoiturage.</Item>
            <Item>Vos données ne sont pas vendues à des tiers.</Item>
            <Item>Vous pouvez demander la suppression de votre compte à tout moment via les paramètres de votre profil.</Item>
            <Item>Les messages échangés via la messagerie interne sont confidentiels entre les parties concernées.</Item>
          </Section>

          {/* 8. Limitation responsabilité */}
          <Section icon="bi-exclamation-triangle" title="8. Limitation de responsabilité générale">
            <p>
              Dans toute la mesure permise par la loi applicable, CampusRide, ses créateurs, administrateurs et affiliés ne pourront être tenus responsables de :
            </p>
            <Item>Tout dommage direct, indirect, accidentel ou consécutif lié à l'utilisation de la plateforme.</Item>
            <Item>Toute perte de données, interruption de service ou dysfonctionnement technique.</Item>
            <Item>Tout acte ou omission d'un utilisateur de la plateforme.</Item>
            <Item>Toute inexactitude dans les informations publiées par les utilisateurs (trajets, horaires, véhicules).</Item>
          </Section>

          {/* 9. Modifications */}
          <Section icon="bi-pencil-square" title="9. Modifications des conditions">
            <p>
              CampusRide se réserve le droit de modifier cet avis de non-responsabilité à tout moment. Les utilisateurs seront informés des changements importants. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          {/* Footer note */}
          <div
            className={`rounded-4 p-4 text-center ${isDark ? "bg-dark border border-secondary" : "bg-white border"}`}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <i className="bi bi-shield-check text-success d-block mb-2" style={{ fontSize: "1.5rem" }} />
            <p className={`mb-2 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.85rem" }}>
              En vous inscrivant sur CampusRide, vous confirmez avoir lu et accepté cet avis de non-responsabilité.
            </p>
            <Link to="/register" className="btn btn-success btn-sm rounded-3 fw-semibold px-4">
              <i className="bi bi-person-plus me-2" />
              Créer un compte
            </Link>
          </div>

        </div>
      </main>

      <Footer isDark={isDark} />
    </div>
  );
}
