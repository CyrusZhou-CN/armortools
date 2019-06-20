package arm.plugin;

import iron.system.Input;
import iron.system.Time;
import iron.math.Vec4;
import arm.ui.UITrait;
import arm.util.ViewportUtil;

class Camera {

	public static var inst:Camera;
	public static var dist = 0.0;
	static inline var speed = 2.0;
	var redraws = 0;
	var first = true;
	var dir = new Vec4();
	var xvec = new Vec4();
	var yvec = new Vec4();
	var ease = 1.0;

	public function new() {
		inst = this;
		var mouse = Input.getMouse();
		var kb = Input.getKeyboard();
		
		iron.App.notifyOnUpdate(function() {
			if (Input.occupied ||
				!arm.App.uienabled ||
				arm.App.isDragging  ||
				UITrait.inst.isScrolling ||
				mouse.x < 0 ||
				mouse.x > iron.App.w()) return;
			
			var camera = iron.Scene.active.camera;

			if (first) {
				first = false;
				reset();
			}

			var controls = UITrait.inst.cameraControls;
			if (controls == 0) {
				if (mouse.wheelDelta != 0) {
					redraws = 2;
					camera.transform.move(camera.look(), mouse.wheelDelta * (-0.1));
				}

				if (mouse.down("middle") || (mouse.down("right") && kb.down("space"))) {
					redraws = 2;
					if (kb.down("control")) {
						camera.transform.move(camera.look(), mouse.movementX / 75);
					}
					else {
						var look = camera.transform.look().normalize().mult(mouse.movementY / 150);
						var right = camera.transform.right().normalize().mult(-mouse.movementX / 150);
						camera.transform.loc.add(look);
						camera.transform.loc.add(right);
						camera.buildMatrix();
					}
				}

				if ((mouse.down("right") && !kb.down("space")) || (mouse.down("left") && kb.down("control"))) {
					redraws = 2;
					var t = UITrait.inst.selectedObject.transform;

					// Rotate X
					var up = t.up().normalize();
					t.rotate(up, mouse.movementX / 100);
					
					// Rotate Y
					if (!kb.down("shift")) {
						var right = camera.rightWorld().normalize();
						t.rotate(right, mouse.movementY / 100);
						t.buildMatrix();

						if (t.up().z < 0) {
							t.rotate(right, -mouse.movementY / 100);
						}
					}
				}
			}
			else if (controls == 1) {

				if (mouse.wheelDelta != 0) {
					redraws = 2;
					var f = mouse.wheelDelta * (-0.1);
					camera.transform.move(camera.look(), f);
					dist -= f;
				}

				if (mouse.down("middle") || (mouse.down("right") && kb.down("space"))) {
					redraws = 2;
					if (kb.down("shift")) {
						var light = iron.Scene.active.lights[0];
						var m = iron.math.Mat4.identity();
						m.self = kha.math.FastMatrix4.rotationZ(mouse.movementX / 100);
						light.transform.local.multmat(m);
						light.transform.decompose();
					}
					else if (kb.down("control")) {
						var f = mouse.movementX / 75;
						camera.transform.move(camera.look(), f);
						dist -= f;
					}
					else {
						var look = camera.transform.look().normalize().mult(mouse.movementY / 150);
						var right = camera.transform.right().normalize().mult(-mouse.movementX / 150);
						camera.transform.loc.add(look);
						camera.transform.loc.add(right);
						camera.buildMatrix();
					}
				}

				if (mouse.down("right") || (mouse.down("left") && kb.down("control"))) {
					redraws = 2;
					camera.transform.move(camera.lookWorld(), dist);
					camera.transform.rotate(new iron.math.Vec4(0, 0, 1), -mouse.movementX / 100);
					
					// Rotate Y
					if (!kb.down("shift")) {
						camera.transform.rotate(camera.rightWorld(), -mouse.movementY / 100);
						if (camera.upWorld().z < 0) {
							camera.transform.rotate(camera.rightWorld(), mouse.movementY / 100);
						}
					}

					camera.transform.move(camera.lookWorld(), -dist);
				}
			}
			else if (controls == 2 && mouse.down("right")) {
				
				var moveForward = kb.down("w") || kb.down("up") || mouse.wheelDelta < 0;
				var moveBackward = kb.down("s") || kb.down("down") || mouse.wheelDelta > 0;
				var strafeLeft = kb.down("a") || kb.down("left");
				var strafeRight = kb.down("d") || kb.down("right");
				var strafeUp = kb.down("e");
				var strafeDown = kb.down("q");
				var fast = kb.down("shift") ? 2.0 : (kb.down("alt") ? 0.5 : 1.0);
				if (mouse.wheelDelta != 0) {
					fast *= Math.abs(mouse.wheelDelta) * 4.0;
				}
				
				if (moveForward || moveBackward || strafeRight || strafeLeft || strafeUp || strafeDown) {
					ease += Time.delta * 15;
					if (ease > 1.0) ease = 1.0;
					dir.set(0, 0, 0);
					if (moveForward) dir.addf(camera.look().x, camera.look().y, camera.look().z);
					if (moveBackward) dir.addf(-camera.look().x, -camera.look().y, -camera.look().z);
					if (strafeRight) dir.addf(camera.right().x, camera.right().y, camera.right().z);
					if (strafeLeft) dir.addf(-camera.right().x, -camera.right().y, -camera.right().z);
					if (strafeUp) dir.addf(0, 0, 1);
					if (strafeDown) dir.addf(0, 0, -1);
				}
				else {
					ease -= Time.delta * 20.0 * ease;
					if (ease < 0.0) ease = 0.0;
				}

				var d = Time.delta * speed * fast * ease;
				if (d > 0.0) {
					UITrait.inst.ddirty = 2;
					camera.transform.move(dir, d);

					if (UITrait.inst.cameraType == 1) {
						ViewportUtil.updateCameraType(UITrait.inst.cameraType);
					}
				}

				if (mouse.down("right")) {
					UITrait.inst.ddirty = 2;
					camera.transform.rotate(Vec4.zAxis(), -mouse.movementX / 200);
					camera.transform.rotate(camera.right(), -mouse.movementY / 200);
				}
			}

			if (redraws > 0) {
				redraws--;
				UITrait.inst.ddirty = 2;

				if (UITrait.inst.cameraType == 1) {
					ViewportUtil.updateCameraType(UITrait.inst.cameraType);
				}
			} 
		});
	}

	public function reset() {
		var camera = iron.Scene.active.camera;
		dist = camera.transform.loc.length();
	}
}
