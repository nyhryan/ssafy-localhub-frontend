import { createRouter, createWebHistory } from "vue-router";
import ChatPage from "../pages/ChatPage.vue";
import CurationPage from "../pages/CurationPage.vue";
import HomePage from "../pages/HomePage.vue";
import MapPage from "../pages/MapPage.vue";
import NotFoundPage from "../pages/NotFoundPage.vue";
import PostDetailPage from "../pages/PostDetailPage.vue";
import PostFormPage from "../pages/PostFormPage.vue";
import PostListPage from "../pages/PostListPage.vue";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return { ...savedPosition, behavior: "instant" };
    }

    if (to.hash) {
      return { el: to.hash, behavior: "instant" };
    }

    return { top: 0, behavior: "instant" };
  },
  routes: [
    { path: "/", name: "home", component: HomePage },
    { path: "/posts", name: "posts", component: PostListPage },
    { path: "/posts/new", name: "post-create", component: PostFormPage },
    {
      path: "/posts/:id",
      name: "post-detail",
      component: PostDetailPage,
      props: true,
    },
    {
      path: "/posts/:id/edit",
      name: "post-edit",
      component: PostFormPage,
      props: true,
    },
    { path: "/chat", name: "chat", component: ChatPage },
    { path: "/curation", name: "curation", component: CurationPage },
    {
      path: "/curation/all",
      name: "curation-all",
      component: CurationPage,
      props: { mode: "all" },
    },
    { path: "/map", name: "map", component: MapPage },
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundPage },
  ],
});

export default router;
