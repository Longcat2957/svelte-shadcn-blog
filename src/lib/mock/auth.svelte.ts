export const authState = $state({
    isLoggedIn: false
});

export const login = () => {
    authState.isLoggedIn = true;
};

export const logout = () => {
    authState.isLoggedIn = false;
};
