import { defineStore } from "pinia";
import { ref } from "vue";
import { User, getUser } from "../lib/bloxadmin";

function getCookie(cookiename: string): string | null {
  	// Get name followed by anything except a semicolon
  	var cookiestring=RegExp(cookiename+"=[^;]+").exec(document.cookie);
  	// Return everything after the equal sign, or an empty string if the cookie name not found
  	return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
}

const useAuthenticationStore = defineStore("authentication", () => {
  const user = ref<User | null>(null);

  const authenticate = async (): Promise<void> => {
    const { body, ok } = await getUser();

    if (ok && body) user.value = body;
    else signOut();
  }

  const signOut = (): void => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/'
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=.bloxadmin.com'

    user.value = null;
  }

  return { user, signOut, authenticate };
});

export default useAuthenticationStore;
