const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },
      { path: "admin", component: () => import("pages/AdminPage.vue") }, // No auth required
      { path: "control", component: () => import("pages/ControlPage.vue") }, // No auth required
      { path: "scoring", component: () => import("pages/ScoringPage.vue") }, // No auth required
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
