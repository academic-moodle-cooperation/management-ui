import * as styles from "../styles";
import { createContext, Provider, useContext } from "react";

export type Theme = {
  components: ThemeComponents;
};

type ThemeComponents = {
  Table: typeof styles.tableStyles;
};

const defaultTheme: Theme = {
  components: {
    Table: styles.tableStyles,
  },
};

export type ThemeContextType = {
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
});

export const ThemeProvider: Provider<ThemeContextType> = ThemeContext.Provider;

export function useTheme(): Theme {
  return useContext(ThemeContext)?.theme || defaultTheme;
}

export function useComponentTheme<C extends keyof ThemeComponents>(component: C) {
  const theme = useTheme();

  return theme.components[component];
}
