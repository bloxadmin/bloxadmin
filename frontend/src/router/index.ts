import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import useAuthenticationStore from "../stores/authentication";
import Dashboard from "../views/Dashboard.vue";
import Game from "../views/Game.vue";
import Games from "../views/Games.vue";
import SignIn from "../views/SignIn.vue";

const Onboarding = () => import("../views/Onboarding.vue");

// Games Routes
const Actions = () => import("../views/Actions.vue");
const Action = () => import("../views/Action.vue");
// const Analytics = () => import("../views/Analytics.vue");
const Data = () => import("../views/Data.vue");
const Datastore = () => import("../views/Datastore.vue");
const DatastoreEntry = () => import("../views/DatastoreEntry.vue");
const DatastoreNoEntry = () => import("../views/DatastoreNoEntry.vue");
const DiscordVerify = () => import("../views/DiscordVerify.vue");
const Errors = () => import("../views/Errors.vue");
const Moderation = () => import("../views/Moderation.vue");
const Player = () => import("../views/Player.vue");
const Players = () => import("../views/Players.vue");
const Server = () => import("../views/Server.vue");
const Servers = () => import("../views/Servers.vue");
const Settings = () => import("../views/Settings.vue");

// Teams Routes
const Groups = () => import("../views/groups/Groups.vue");
const Group = () => import("../views/groups/Group.vue");
const GroupOverview = () => import("../views/groups/GroupOverview.vue");

// Admin Routes
const AdminDashboard = () => import("../views/admin/AdminDashboard.vue");
const Admin = () => import("../views/admin/Admin.vue");
const AdminGames = () => import("../views/admin/AdminGames.vue");
const AdminGame = () => import("../views/admin/AdminGame.vue");
const AdminUsers = () => import("../views/admin/AdminUsers.vue");

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Landing",
    redirect: { name: "Games" }
  },
  {
    path: "/discord-verify",
    name: "Discord verify",
    component: DiscordVerify,
  },
  {
    path: "/sign-in",
    name: "Sign in",
    component: SignIn,
    beforeEnter() {
      const { user } = useAuthenticationStore();

      if (!user) return;

      return { path: "/games" };
    }
  },
  {
    path: "/new/:gameIdentifier",
    name: "New games",
    props: true,
    component: Dashboard,
    beforeEnter(to, from) {
      const { user } = useAuthenticationStore();

      if (user) return;

      return { path: "/sign-in" };
    },
    children: [
      {
        path: "",
        name: "New game",
        props: true,
        component: Onboarding,
      },
    ]
  },
  {
    path: "/games",
    name: "Dashboard",
    component: Dashboard,
    beforeEnter(to, from) {
      const { user } = useAuthenticationStore();

      if (user) return;

      return { path: "/sign-in" };
    },
    children: [
      {
        path: "",
        name: "Games",
        component: Games,
        // beforeEnter(to, from) {
        //   const gameIdentifier = localStorage.getItem("gameIdentifier");

        //   if (from.name || !gameIdentifier || window.location.pathname === "/games") return;

        //   return {
        //     name: "Servers",
        //     params: { gameIdentifier }
        //   }
        // },
      },
      {
        path: ":gameIdentifier",
        name: "Game",
        component: Game,
        props: true,
        beforeEnter(to) {
          localStorage.setItem("gameIdentifier", to.params.gameIdentifier as string);
        },
        children: [
          // {
          //   path: "",
          //   name: "Analytics",
          //   props: true,
          //   component: Analytics
          // },
          {
            path: "",
            redirect: { name: "Servers" }
          },
          {
            path: "servers",
            name: "Servers",
            props: true,
            component: Servers
          },
          {
            path: "servers/:serverIdentifier",
            name: "Server",
            props: true,
            component: Server
          },
          {
            path: "players",
            name: "Players",
            props: true,
            component: Players
          },
          {
            path: "players/:playerIdentifier",
            name: "Player",
            props: true,
            component: Player
          },
          {
            path: "moderation",
            name: "Moderation",
            props: true,
            component: Moderation
          },
          {
            path: "data",
            name: "Data",
            props: true,
            component: Data
          },
          {
            path: "datastore/:dataStore",
            name: "Datastore",
            props: true,
            meta: {
              noOutline: true
            },
            component: Datastore,
            children: [
              {
                path: "",
                name: "Datastore No Entry",
                props: true,
                component: DatastoreNoEntry,
              },
              {
                path: "entries/:entryKey",
                name: "Datastore Entry",
                props: true,
                component: DatastoreEntry,
              }
            ]
          },
          {
            path: "actions",
            props: true,
            children: [
              {
                path: "",
                name: "Actions",
                props: true,
                component: Actions,
                meta: {
                  noOutline: true
                },
              },
              {
                path: ":action",
                name: "Action",
                props: true,
                component: Action,
              }
            ]
          },
          {
            path: "errors",
            name: "Errors",
            props: true,
            component: Errors
          },
          {
            path: "settings",
            name: "Settings",
            props: true,
            component: Settings
          },
          {
            path: ":pathMatch(.*)*",
            redirect: () => ({ name: "Servers" })
          }
        ]
      },
    ]
  },
  {
    path: "/groups",
    component: Dashboard,
    beforeEnter(to, from) {
      const { user } = useAuthenticationStore();

      if (user) return;

      return { path: "/sign-in" };
    },
    children: [
      {
        path: "",
        name: "Groups",
        component: Groups,
      },
      {
        path: ":groupIdentifier",
        component: Group,
        props: true,
        beforeEnter(to) {
          localStorage.setItem("groupIdentifier", to.params.groupIdentifier as string);
        },
        children: [
          {
            path: "",
            name: "Group",
            props: true,
            component: GroupOverview
          },
          {
            path: "users",
            name: "Group Users",
            props: true,
            children: [
              {
                path: ":userIdentifier",
                name: "Group User",
                props: true,
                component: Group
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: "/admin",
    component: AdminDashboard,
    beforeEnter(to, from) {
      const { user } = useAuthenticationStore();

      if (user?.admin) return;

      return { path: "/games" };
    },
    children: [
      {
        path: "",
        name: "Admin",
        component: Admin,
      },
      {
        path: "games",
        children: [
          {
            path: "",
            name: "Admin Games",
            component: AdminGames,
          },
          {
            path: ":gameIdentifier",
            name: "Admin Game",
            component: AdminGame,
            props: true,
          }
        ]
      },
      {
        path: "users",
        children: [
          {
            path: "",
            name: "Admin Users",
            component: AdminUsers,
          },
          {
            path: ":playerIdentifier",
            name: "Admin User",
            component: AdminUsers,
            props: true,
          }
        ]
      },
    ]
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/"
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (route) => {
  const { user, authenticate } = useAuthenticationStore();

  if (user) return;

  if (route.name === "Landing") {
    authenticate();
    return;
  }

  await authenticate();
});

export default router;
