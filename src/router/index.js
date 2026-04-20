import Vue from 'vue';
import VueRouter from 'vue-router';
import Load from '../views/Load.vue';
import Info from '../views/Info.vue';
import Convert from '../views/Convert.vue';
import About from '../views/About.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Load',
    component: Load
  },
  {
    path: '/info',
    name: 'Info',
    component: Info
  },
  {
    path: '/convert',
    name: 'Convert',
    component: Convert
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
];

const router = new VueRouter({
  routes
});

router.beforeEach((to,from,next) => {
  const search = new URL(window.location.href).searchParams;
  if ( ( search.get("code") || search.get("error") ) && to.name !== 'Load' ) {
    next({ path: '/' });
  } else {
    next();
  }
});

export default router;
