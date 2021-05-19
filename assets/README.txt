HUD System
***********************************************************************************************
The HUD system works through the use of three controllers.
The HUDController, ObjectController and HandController.

The HUDController is added as a component of an empty game object by the same name.
This controller controls the display of the HUD. The UI, background and text, is passed in
through a public serialized field - visible in editor.
The HUDController has two methods, ShowInfo and HideInfo. These methods, when called, set the
UI as active (also passing in the object description recieved from the object controller) or not
active respectively.

The ObjectController is added as a component of 'interactable' objects (shrine objects).
A is included public serialize text field to add description text - visible in editor. Two methods,
ShowObjectDescription and HideObjectDescription, can be called. The first one calls the
HUDController's ShowInfo method, and the second one the HideInfo method.

The HandController is added as a component of the LeftHand and RightHand Controllers.
On trigger, this controller accesses the interactable object's ObjectController, calling the
ShowObjectDescription and HideObjectDescription - respectively showing and hiding the descritpion 
text.