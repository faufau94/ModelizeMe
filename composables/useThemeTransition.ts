/**
 * Composable for circular theme transition using the View Transition API.
 * Always expands from the clicked icon. Falls back to instant switch if unsupported.
 */
export function useThemeTransition() {
  const colorMode = useColorMode();

  const setTheme = (value: string, event?: MouseEvent) => {
    const switchTheme = () => {
      colorMode.preference = value;
    };

    if (
      !document.startViewTransition ||
      !event ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      switchTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(switchTheme);

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 400,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  return { colorMode, setTheme };
}
