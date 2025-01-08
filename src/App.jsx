import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./App.css";

import Navbar from "./components/navbar/navbar";
import Loading from "./pages/loading/loadingPage";
import Home from "./pages/home/homePage";
import Shop from "./pages/store/shopPage";
import Leaderboard from "./pages/leaderboard/leaderboardPage";
import Quests from "./pages/quests/questsPage";
import Friends from "./pages/friends/friendsPage";
import { UserProvider } from "./contexts/UserContext";
import GlobalToast from "./components/GlobalToast";

function App() {
  return (
    <div className="app-container">
      <UserProvider>
        <Router>
          {/* Global Toast Container */}
          <GlobalToast theme="dark" />

          {/* Routes and Navbar */}
          <AppRoutes />
        </Router>
      </UserProvider>
    </div>
  );
}

/**
 * AppRoutes handles all the route definitions AND 
 * conditionally renders the Navbar depending on the path.
 */
function AppRoutes() {
  const location = useLocation();

  return (
    <>
      <div className="content">
        <Routes>
          {/* Default route: "/" => shows LoadingPage */}
          <Route path="/" element={<Loading />} />

          {/* Main Home route (No need to pass telegramId) */}
          <Route path="/home" element={<Home />} />

          {/* Leaderboard route */}
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Quests route */}
          <Route path="/quests" element={<Quests />} />

          {/* Shop and Friends routes */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/friends" element={<Friends />} />

          {/* Optional: Redirect any unknown routes to 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>

      {/*
        Conditionally render the Navbar ONLY if we're NOT on "/"
        i.e. NOT on the loading screen
      */}
      {location.pathname !== "/" && <Navbar />}
    </>
  );
}

export default App;