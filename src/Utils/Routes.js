import Dashboard from "../Screens/Dashboard";
import Login from "../Screens/Login/Login";
import Portrait from "../Screens/PortraitDashboard";
import Splash from "../Screens/Splash";

export const route = [
  {
    name: "Splash",
    component: Splash,
    option: {
      headerShown: false,
    },
  },
  {
    name: "Login",
    component: Login,
    option: {
      headerShown: false,
    },
  },
  {
    name: "Dashboard",
    component: Dashboard,
    option: {
      headerShown: false,
    },
  },
];

export const portraitRoute = [
  {
    name: "Splash",
    component: Splash,
    option: {
      headerShown: false,
    },
  },
  {
    name: "Login",
    component: Login,
    option: {
      headerShown: false,
    },
  },
  {
    name: "Dashboard",
    component: Portrait,
    option: {
      headerShown: false,
    },
  },
];
