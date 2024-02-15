# Known Issues

The following are bugs that are not in modeling-app or kcl itself. These bugs
once fixed in engine will just start working here with no language changes.

- **Sketch on Face**: If your sketch is outside the edges of the face (on which you
    are sketching) you will get multiple models returned instead of one single
    model for that sketch and its underlying 3D object.

- **Patterns**: If you try and pass a pattern to `hole` currently only the first
    item in the pattern is being subtracted. This is an engine bug that is being
    worked on.
  
- **Import**: Right now you can import a file, even if that file has brep data
    you cannot edit it. You also cannot move or transform the imported objects at
   all. In the future, after v1, the engine will account for this.