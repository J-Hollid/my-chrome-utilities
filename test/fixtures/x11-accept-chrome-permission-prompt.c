#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include <X11/Xatom.h>
#include <X11/Xlib.h>
extern int XTestFakeMotionEvent(Display *, int, int, int, unsigned long);
extern int XTestFakeButtonEvent(Display *, unsigned int, Bool, unsigned long);

static Window best_window = 0;
static unsigned long best_area = 0;

static Window window_for_pid(Display *display, Window parent, Atom pid_atom,
                             unsigned long expected_pid) {
  Atom actual_type;
  int actual_format;
  unsigned long count;
  unsigned long remaining;
  unsigned char *property = NULL;
  if (XGetWindowProperty(display, parent, pid_atom, 0, 1, False, XA_CARDINAL,
                         &actual_type, &actual_format, &count, &remaining,
                         &property) == Success && property != NULL) {
    const unsigned long pid = *(unsigned long *)property;
    XFree(property);
    XWindowAttributes attributes;
    if (pid == expected_pid && XGetWindowAttributes(display, parent, &attributes)
        && attributes.map_state == IsViewable && attributes.class == InputOutput) {
      const unsigned long area = (unsigned long)attributes.width
          * (unsigned long)attributes.height;
      if (area > best_area) {
        best_window = parent;
        best_area = area;
      }
    }
  }

  Window root;
  Window parent_return;
  Window *children = NULL;
  unsigned int child_count = 0;
  if (!XQueryTree(display, parent, &root, &parent_return, &children,
                  &child_count)) return 0;
  for (unsigned int index = 0; index < child_count; index += 1) {
    window_for_pid(display, children[index], pid_atom, expected_pid);
  }
  if (children != NULL) XFree(children);
  return best_window;
}

int main(int argc, char **argv) {
  if (argc != 2) return 2;
  Display *display = XOpenDisplay(NULL);
  if (display == NULL) return 3;
  const unsigned long pid = strtoul(argv[1], NULL, 10);
  const Atom pid_atom = XInternAtom(display, "_NET_WM_PID", False);
  const Window target = window_for_pid(display, DefaultRootWindow(display),
                                       pid_atom, pid);
  if (target == 0) {
    XCloseDisplay(display);
    return 4;
  }
  XWindowAttributes attributes;
  Window translated_child;
  int root_x;
  int root_y;
  XGetWindowAttributes(display, target, &attributes);
  XTranslateCoordinates(display, target, DefaultRootWindow(display), 0, 0,
                        &root_x, &root_y, &translated_child);
  const int click_x = root_x + attributes.width / 2 + 170;
  const int click_y = root_y + 270;
  XRaiseWindow(display, target);
  XSetInputFocus(display, target, RevertToParent, CurrentTime);
  XFlush(display);
  usleep(100000);
  XTestFakeMotionEvent(display, DefaultScreen(display),
                       click_x, click_y, CurrentTime);
  XFlush(display);
  usleep(50000);
  XTestFakeButtonEvent(display, 1, True, CurrentTime);
  XTestFakeButtonEvent(display, 1, False, CurrentTime);
  XFlush(display);
  XCloseDisplay(display);
  return 0;
}
