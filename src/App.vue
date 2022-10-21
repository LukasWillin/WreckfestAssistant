<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav>
  <router-view />
</template>

<style lang="scss">
:root {
  --primary-accent: #fdd50d;
  --primary-accent-alpha: #fdd50dd0;
  --background-color: #111;
  --background-color-alpha: #111a;
  --primary-color: #ddd;
  --bs-body-bg: var(--background-color);
  --bs-body-color: var(--primary-color);
  --bs-link-hover-color: rgb(255, 240, 141);
}

* {
  color: var(--primary-color);
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
  height: calc(100vh);
  width: calc(100vw);
  z-index: -1;
}

body {
    background-color: var(--background-color);
    margin-top: -4px;

    .bg {
        background: url(@/assets/img/bg-1.webp);
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        filter: blur(16px);
        position: fixed;
        z-index: -1;
        height: calc(100vh + 16px * 2);
        width: calc(100vw + 16px * 2);
        top: 0;
        left: 0;
        margin: -16px;
    }
}

.form-label {
    background-color: var(--background-color-alpha);
    padding: .25rem 1rem .25rem .75rem;
    margin-left: 0;
}

textarea.form-control,
textarea.form-control:focus,
textarea.form-control:disabled {
  background-color: #111;
  color: var(--primary-color);
  border: none;
}

textarea.form-control:focus {
  box-shadow: 0 0 0 0.25rem var(--primary-accent-alpha);
}

textarea {
  background-color: #111;
  width: 100%;
  font-family: consolas !important;
}

#drop_zone {
  border: 5px solid blue;
  width: 200px;
  height: 100px;
}

button {
  margin: 0.25rem;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
//   text-align: center;
  color: var(--primary-color);
}

nav {
    margin: 20px .5rem;
    padding: 1rem 1.5rem;

    a {
        font-weight: bold;
        color: var(--primary-color);

        &.router-link-exact-active {
            color: var(--primary-accent);
        }
    }
}
</style>
