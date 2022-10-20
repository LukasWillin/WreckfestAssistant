<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav>
  <router-view />
</template>

<style lang="scss">
* {
  color: #ccc;
  padding: 0.25rem;
  border: none;
  border-radius: 0.25rem;
  margin: 0.25rem;
}

body,
html {
  border: none;
  margin: 0;
  padding: 0;
  height: calc(100vh - 1.01rem);
  width: calc(100vw - 1.01rem);
}

body .bg {
  background: url(@/assets/img/bg-1.webp);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(16px);
  position: fixed;
  z-index: -1;
  height: 100vh;
  width: 100vw;
  top: 0;
  left: 0;
}

textarea {
  background-color: #111;
  width: 100%;
  font-family: consolas !important;
}

button {
  margin: 0.25rem;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
