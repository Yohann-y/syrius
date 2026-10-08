import './download.css'

const apkUrl = import.meta.env.VITE_APK_DOWNLOAD_URL || '/syrius.apk'

function App() {
  return (
    <main className="download-page">
      <a className="download-button" href={apkUrl} download="syrius.apk">
        Télécharger l’application Android (APK)
      </a>
    </main>
  )
}

export default App
