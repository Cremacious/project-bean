import { StatusBar } from "expo-status-bar";
import { AppDataProvider } from "./src/data/store";
import { NotificationsProviderScope } from "./src/notifications/context";
import { Navigator } from "./src/navigation/Navigator";

// Bedtime Quests native app (issue #54). The UI is a faithful port of the web
// screens, reusing @bedtime-quests/core for every rule and computation. The data
// layer is local/in-memory for this UI port (see README): auth is a stub, and
// purchasing is deferred to native billing (#55). AppDataProvider holds session +
// gameplay state; NotificationsProviderScope owns the bedtime reminder (#56);
// Navigator decides the screen flow from that state.
export default function App() {
  return (
    <AppDataProvider>
      <NotificationsProviderScope>
        <StatusBar style="dark" />
        <Navigator />
      </NotificationsProviderScope>
    </AppDataProvider>
  );
}
