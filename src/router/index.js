import Vue from 'vue'
import VueRouter from 'vue-router'
import IndexPage from '@/views/index/IndexPage.vue'
import LoginPage from '@/views/login/LoginPage.vue'
import ProductDetail from '@/views/item/ProductDetail.vue'
import OrderPage from '@/views/order/OrderPage.vue'
import CartPage from '@/views/cart/CartPage.vue'
import PayPage from '@/views/pay/PayPage.vue'
import UserPage from '@/views/user/UserPage.vue'
import SeckillPage from '@/views/seckill/SeckillPage.vue'
import SeckillDetail from '@/views/seckill/SeckillDetail.vue'
import ItemManagePage from '@/views/admin/ItemManagePage.vue'
Vue.use(VueRouter)

// 创建路由对象
const router = new VueRouter({
  routes: [
    { path: '/', component: IndexPage },
    {
      path: '/seckill',
      component: SeckillPage
    },
    {
      path: '/seckill/:id',
      component: SeckillDetail
    },
    {
      path: '/login',
      component: LoginPage
    },
    {
      path: '/product/:id', // 动态路由参数 :id
      component: ProductDetail
    },
    {
      path: '/orderlist',
      component: OrderPage
    },
    {
      path: '/cart',
      component: CartPage
    },
    {
      path: '/pay',
      component: PayPage
    },
    {
      path: '/user',
      component: UserPage
    },
    {
      path: '/admin/items',
      component: ItemManagePage
    }
  ]
})

// 页面分类：登录页 和 非登录页
// 逻辑：登录页可以访问的，但是其他所有的页面，都需要token才能访问
// 问题：什么时候需要拦截到登录？其他情况正常放行
// 非登录页 且 无token => 直接拦截到登录

// 全局前置导航守卫 => 实现登录访问拦截 （只有登录过的用户，才能往里面看）
// router.beforeEach((to, from, next) => {
//   // 通过原生vuex语法，获取到vuex中的token，记住：以vuex为主，storage为辅，统一入口！
//   const token = store.state.user.token

//   if (to.path !== '/login' && !token) {
//     // 需要拦截 (去的不是登录，且还没token) 拦截到登录
//     next('/login')
//   } else {
//     // 要么是去登录，要么是有token，都是直接放行
//     next()
//   }
// })

export default router
