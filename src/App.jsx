import { useState } from "react";
import Login from "./components/Login";
import MapContainer from "./components/MapContainer";

function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <MapContainer />
      )}
    </>
  );
}

export default App;
