
///if (is_paint || is_sculpt)
let ui_view2d_pipe: pipeline_t;
let ui_view2d_channel_loc: kinc_const_loc_t;
let ui_view2d_text_input_hover: bool = false;
let ui_view2d_uvmap_show: bool = false;
let ui_view2d_tex_type: paint_tex_t = paint_tex_t.BASE;
let ui_view2d_layer_mode: view_2d_layer_mode_t = view_2d_layer_mode_t.SELECTED;
///end

///if (is_paint || is_sculpt)
let ui_view2d_type: view_2d_type_t = view_2d_type_t.LAYER;
///else
let ui_view2d_type: view_2d_type_t = view_2d_type_t.ASSET;
///end

let ui_view2d_show: bool = false;
let ui_view2d_wx: i32;
let ui_view2d_wy: i32;
let ui_view2d_ww: i32;
let ui_view2d_wh: i32;
let ui_view2d_ui: zui_t;
let ui_view2d_hwnd: zui_handle_t = zui_handle_create();
let ui_view2d_pan_x: f32 = 0.0;
let ui_view2d_pan_y: f32 = 0.0;
let ui_view2d_pan_scale: f32 = 1.0;
let ui_view2d_tiled_show: bool = false;
let ui_view2d_controls_down: bool = false;

function ui_view2d_init() {
	///if (is_paint || is_sculpt)
	ui_view2d_pipe = g4_pipeline_create();
	ui_view2d_pipe.vertex_shader = sys_get_shader("layer_view.vert");
	ui_view2d_pipe.fragment_shader = sys_get_shader("layer_view.frag");
	let vs: vertex_struct_t = g4_vertex_struct_create();
	g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
	g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
	g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
	ui_view2d_pipe.input_layout = [vs];
	ui_view2d_pipe.blend_source = blend_factor_t.BLEND_ONE;
	ui_view2d_pipe.blend_dest = blend_factor_t.BLEND_ZERO;
	ui_view2d_pipe.color_write_masks_alpha[0] = false;
	g4_pipeline_compile(ui_view2d_pipe);
	ui_view2d_channel_loc = g4_pipeline_get_const_loc(ui_view2d_pipe, "channel");
	///end

	let scale: f32 = config_raw.window_scale;
	ui_view2d_ui = zui_create({ theme: base_theme, font: base_font, color_wheel: base_color_wheel, black_white_gradient: base_color_wheel_gradient, scale_factor: scale });
	ui_view2d_ui.scroll_enabled = false;
}

function ui_view2d_render() {

	ui_view2d_ww = config_raw.layout[layout_size_t.NODES_W];

	///if (is_paint || is_sculpt)
	ui_view2d_wx = math_floor(app_w()) + ui_toolbar_w;
	///else
	ui_view2d_wx = math_floor(app_w());
	///end

	ui_view2d_wy = 0;

	///if (is_paint || is_sculpt)
	if (!ui_base_show) {
		ui_view2d_ww += config_raw.layout[layout_size_t.SIDEBAR_W] + ui_toolbar_w;
		ui_view2d_wx -= ui_toolbar_w;
	}
	///end

	if (!ui_view2d_show) {
		return;
	}
	if (sys_width() == 0 || sys_height() == 0) {
		return;
	}

	if (context_raw.pdirty >= 0) {
		ui_view2d_hwnd.redraws = 2; // Paint was active
	}

	g2_end();

	// Cache grid
	if (ui_nodes_grid == null) {
		ui_nodes_draw_grid();
	}

	// Ensure UV map is drawn
	///if (is_paint || is_sculpt)
	if (ui_view2d_uvmap_show) {
		util_uv_cache_uv_map();
	}
	///end

	// Ensure font image is drawn
	///if (is_paint || is_sculpt)
	if (context_raw.font.image == null) {
		util_render_make_font_preview();
	}
	///end

	zui_begin(ui_view2d_ui);

	let headerh: i32 = config_raw.layout[layout_size_t.HEADER] == 1 ? ui_header_h * 2 : ui_header_h;
	let apph: i32 = sys_height() - config_raw.layout[layout_size_t.STATUS_H] + headerh;
	ui_view2d_wh = sys_height() - config_raw.layout[layout_size_t.STATUS_H];

	if (ui_nodes_show) {
		ui_view2d_wh -= config_raw.layout[layout_size_t.NODES_H];
		if (config_raw.touch_ui) ui_view2d_wh += ui_header_h;
	}

	if (zui_window(ui_view2d_hwnd, ui_view2d_wx, ui_view2d_wy, ui_view2d_ww, ui_view2d_wh)) {

		zui_tab(zui_handle(__ID__), tr("2D View"));

		// Grid
		g2_set_color(0xffffffff);
		g2_draw_image(ui_nodes_grid, (ui_view2d_pan_x * ui_view2d_pan_scale) % 100 - 100, (ui_view2d_pan_y * ui_view2d_pan_scale) % 100 - 100);

		// Texture
		let tex: image_t = null;

		///if (is_paint || is_sculpt)
		let l: slot_layer_t = context_raw.layer;
		let channel: i32 = 0;
		///end

		let tw: f32 = ui_view2d_ww * 0.95 * ui_view2d_pan_scale;
		let tx: f32 = ui_view2d_ww / 2 - tw / 2 + ui_view2d_pan_x;
		let ty: f32 = apph / 2 - tw / 2 + ui_view2d_pan_y;

		if (ui_view2d_type == view_2d_type_t.ASSET) {
			tex = project_get_image(context_raw.texture);
		}
		else if (ui_view2d_type == view_2d_type_t.NODE) {
			///if (is_paint || is_sculpt)

			tex = context_raw.node_preview;

			///else

			let nodes: zui_nodes_t = ui_nodes_get_nodes();
			if (nodes.nodes_selected_id.length > 0) {
				let sel: zui_node_t = zui_get_node(ui_nodes_get_canvas(true).nodes, nodes.nodes_selected_id[0]);
				let brush_node: LogicNode = parser_logic_get_logic_node(sel);
				if (brush_node != null) {
					tex = brush_node.get_cached_image();
				}
			}

			///end
		}
		///if is_paint
		else if (ui_view2d_type == view_2d_type_t.LAYER) {
			let layer: slot_layer_t = l;

			if (config_raw.brush_live && render_path_paint_live_layer_drawn > 0) {
				layer = render_path_paint_live_layer;
			}

			if (ui_view2d_layer_mode == view_2d_layer_mode_t.VISIBLE) {
				let current: image_t = _g2_current;
				let g2_in_use: bool = _g2_in_use;
				if (g2_in_use) g2_end();
				layer = base_flatten();
				if (g2_in_use) g2_begin(current);
			}
			else if (slot_layer_is_group(layer)) {
				let current: image_t = _g2_current;
				let g2_in_use: bool = _g2_in_use;
				if (g2_in_use) g2_end();
				layer = base_flatten(false, slot_layer_get_children(layer));
				if (g2_in_use) g2_begin(current);
			}

			tex =
				slot_layer_is_mask(context_raw.layer) ? layer.texpaint :
				ui_view2d_tex_type == paint_tex_t.BASE     ? layer.texpaint :
				ui_view2d_tex_type == paint_tex_t.OPACITY  ? layer.texpaint :
				ui_view2d_tex_type == paint_tex_t.NORMAL   ? layer.texpaint_nor :
														layer.texpaint_pack;

			channel =
				slot_layer_is_mask(context_raw.layer)  ? 1 :
				ui_view2d_tex_type == paint_tex_t.OCCLUSION ? 1 :
				ui_view2d_tex_type == paint_tex_t.ROUGHNESS ? 2 :
				ui_view2d_tex_type == paint_tex_t.METALLIC  ? 3 :
				ui_view2d_tex_type == paint_tex_t.OPACITY   ? 4 :
				ui_view2d_tex_type == paint_tex_t.HEIGHT    ? 4 :
				ui_view2d_tex_type == paint_tex_t.NORMAL    ? 5 :
														0;
		}
		else if (ui_view2d_type == view_2d_type_t.FONT) {
			tex = context_raw.font.image;
		}
		///end

		let th: f32 = tw;
		if (tex != null) {
			th = tw * (tex.height / tex.width);
			ty = apph / 2 - th / 2 + ui_view2d_pan_y;

			///if (is_paint || is_sculpt)
			if (ui_view2d_type == view_2d_type_t.LAYER) {
				///if (!krom_opengl)
				g2_set_pipeline(ui_view2d_pipe);
				///end
				if (!context_raw.texture_filter) {
					g2_set_bilinear_filter(false);
				}
				///if krom_opengl
				krom_g4_set_pipeline(ui_view2d_pipe.pipeline_);
				///end
				krom_g4_set_int(ui_view2d_channel_loc, channel);
			}
			///end

			g2_draw_scaled_image(tex, tx, ty, tw, th);

			if (ui_view2d_tiled_show) {
				g2_draw_scaled_image(tex, tx - tw, ty, tw, th);
				g2_draw_scaled_image(tex, tx - tw, ty - th, tw, th);
				g2_draw_scaled_image(tex, tx - tw, ty + th, tw, th);
				g2_draw_scaled_image(tex, tx + tw, ty, tw, th);
				g2_draw_scaled_image(tex, tx + tw, ty - th, tw, th);
				g2_draw_scaled_image(tex, tx + tw, ty + th, tw, th);
				g2_draw_scaled_image(tex, tx, ty - th, tw, th);
				g2_draw_scaled_image(tex, tx, ty + th, tw, th);
			}

			///if (is_paint || is_sculpt)
			if (ui_view2d_type == view_2d_type_t.LAYER) {
				g2_set_pipeline(null);
				if (!context_raw.texture_filter) {
					g2_set_bilinear_filter(true);
				}
			}

			// Texture and node preview color picking
			if ((context_in_2d_view(view_2d_type_t.ASSET) || context_in_2d_view(view_2d_type_t.NODE)) && context_raw.tool == workspace_tool_t.PICKER && ui_view2d_ui.input_down) {
				let x: f32 = ui_view2d_ui.input_x - tx - ui_view2d_wx;
				let y: f32 = ui_view2d_ui.input_y - ty - ui_view2d_wy;
				base_notify_on_next_frame(function () {
					let texpaint_picker: image_t = map_get(render_path_render_targets, "texpaint_picker")._image;
					g2_begin(texpaint_picker);
					g2_draw_scaled_image(tex, -x, -y, tw, th);
					g2_end();
					let a: buffer_view_t = buffer_view_create(image_get_pixels(texpaint_picker));
					///if (krom_metal || krom_vulkan)
					let i0: i32 = 2;
					let i1: i32 = 1;
					let i2: i32 = 0;
					///else
					let i0: i32 = 0;
					let i1: i32 = 1;
					let i2: i32 = 2;
					///end

					context_raw.picked_color.base = color_set_rb(context_raw.picked_color.base, buffer_view_get_u8(a, i0));
					context_raw.picked_color.base = color_set_gb(context_raw.picked_color.base, buffer_view_get_u8(a, i1));
					context_raw.picked_color.base = color_set_bb(context_raw.picked_color.base, buffer_view_get_u8(a, i2));
					ui_header_handle.redraws = 2;
				});
			}
			///end
		}

		///if (is_paint || is_sculpt)
		// UV map
		if (ui_view2d_type == view_2d_type_t.LAYER && ui_view2d_uvmap_show) {
			g2_draw_scaled_image(util_uv_uvmap, tx, ty, tw, th);
		}
		///end

		// Menu
		let ew: i32 = math_floor(zui_ELEMENT_W(ui_view2d_ui));
		g2_set_color(ui_view2d_ui.t.SEPARATOR_COL);
		g2_fill_rect(0, zui_ELEMENT_H(ui_view2d_ui), ui_view2d_ww, zui_ELEMENT_H(ui_view2d_ui) + zui_ELEMENT_OFFSET(ui_view2d_ui) * 2);
		g2_set_color(0xffffffff);

		let start_y: f32 = zui_ELEMENT_H(ui_view2d_ui) + zui_ELEMENT_OFFSET(ui_view2d_ui);
		ui_view2d_ui._x = 2;
		ui_view2d_ui._y = 2 + start_y;
		ui_view2d_ui._w = ew;

		// Editable layer name
		let h: zui_handle_t = zui_handle(__ID__);

		///if (is_paint || is_sculpt)
		let text: string = ui_view2d_type == view_2d_type_t.NODE ? context_raw.node_preview_name : h.text;
		///else
		let text: string = h.text;
		///end

		ui_view2d_ui._w = math_floor(math_min(g2_font_width(ui_view2d_ui.font, ui_view2d_ui.font_size, text) + 15 * zui_SCALE(ui_view2d_ui), 100 * zui_SCALE(ui_view2d_ui)));

		if (ui_view2d_type == view_2d_type_t.ASSET) {
			let asset: asset_t = context_raw.texture;
			if (asset != null) {
				let asset_names: string[] = project_asset_names;
				let i: i32 = array_index_of(asset_names, asset.name);
				h.text = asset.name;
				asset.name = zui_text_input(h, "");
				asset_names[i] = asset.name;
			}
		}
		else if (ui_view2d_type == view_2d_type_t.NODE) {
			///if (is_paint || is_sculpt)

			zui_text(context_raw.node_preview_name);

			///else

			let nodes: zui_nodes_t = ui_nodes_get_nodes();
			if (nodes.nodes_selected_id.length > 0) {
				zui_text(zui_get_node(ui_nodes_get_canvas(true).nodes, nodes.nodes_selected_id[0]).name);
			}

			///end
		}
		///if (is_paint || is_sculpt)
		else if (ui_view2d_type == view_2d_type_t.LAYER) {
			h.text = l.name;
			l.name = zui_text_input(h, "");
			ui_view2d_text_input_hover = ui_view2d_ui.is_hovered;
		}
		else if (ui_view2d_type == view_2d_type_t.FONT) {
			h.text = context_raw.font.name;
			context_raw.font.name = zui_text_input(h, "");
		}
		///end

		if (h.changed) {
			ui_base_hwnds[0].redraws = 2;
		}
		ui_view2d_ui._x += ui_view2d_ui._w + 3;
		ui_view2d_ui._y = 2 + start_y;
		ui_view2d_ui._w = ew;

		///if (is_paint || is_sculpt)
		if (ui_view2d_type == view_2d_type_t.LAYER) {
			ui_view2d_layer_mode = zui_combo(zui_handle(__ID__, { position: ui_view2d_layer_mode }), [
				tr("Visible"),
				tr("Selected"),
			], tr("Layers"));
			ui_view2d_ui._x += ew + 3;
			ui_view2d_ui._y = 2 + start_y;

			if (!slot_layer_is_mask(context_raw.layer)) {
				ui_view2d_tex_type = zui_combo(zui_handle(__ID__, { position: ui_view2d_tex_type }), [
					tr("Base Color"),
					tr("Normal Map"),
					tr("Occlusion"),
					tr("Roughness"),
					tr("Metallic"),
					tr("Opacity"),
					tr("Height"),
				], tr("Texture"));
				ui_view2d_ui._x += ew + 3;
				ui_view2d_ui._y = 2 + start_y;
			}

			ui_view2d_ui._w = math_floor(ew * 0.7 + 3);
			ui_view2d_uvmap_show = zui_check(zui_handle(__ID__, { selected: ui_view2d_uvmap_show }), tr("UV Map"));
			ui_view2d_ui._x += ew * 0.7 + 3;
			ui_view2d_ui._y = 2 + start_y;
		}
		///end

		ui_view2d_tiled_show = zui_check(zui_handle(__ID__, { selected: ui_view2d_tiled_show }), tr("Tiled"));
		ui_view2d_ui._x += ew * 0.7 + 3;
		ui_view2d_ui._y = 2 + start_y;

		if (ui_view2d_type == view_2d_type_t.ASSET && tex != null) { // Texture resolution
			zui_text(tex.width + "x" + tex.height);
		}

		// Picked position
		///if (is_paint || is_sculpt)
		if (context_raw.tool == workspace_tool_t.PICKER && (ui_view2d_type == view_2d_type_t.LAYER || ui_view2d_type == view_2d_type_t.ASSET)) {
			let cursor_img: image_t = resource_get("cursor.k");
			let hsize: f32 = 16 * zui_SCALE(ui_view2d_ui);
			let size: f32 = hsize * 2;
			g2_draw_scaled_image(cursor_img, tx + tw * context_raw.uvx_picked - hsize, ty + th * context_raw.uvy_picked - hsize, size, size);
		}
		///end
	}
	zui_end();
	g2_begin(null);
}

function ui_view2d_update() {
	let headerh: f32 = zui_ELEMENT_H(ui_view2d_ui) * 1.4;

	///if (is_paint || is_sculpt)
	context_raw.paint2d = false;
	///end

	if (!base_ui_enabled ||
		!ui_view2d_show ||
		mouse_x < ui_view2d_wx ||
		mouse_x > ui_view2d_wx + ui_view2d_ww ||
		mouse_y < ui_view2d_wy + headerh ||
		mouse_y > ui_view2d_wy + ui_view2d_wh) {
		if (ui_view2d_controls_down) {
			let control: zui_canvas_control_t = ui_nodes_get_canvas_control(ui_view2d_ui, ui_view2d_controls_down);
			ui_view2d_controls_down = control.controls_down;
		}
		return;
	}

	let control: zui_canvas_control_t = ui_nodes_get_canvas_control(ui_view2d_ui, ui_view2d_controls_down);
	ui_view2d_pan_x += control.pan_x;
	ui_view2d_pan_y += control.pan_y;
	ui_view2d_controls_down = control.controls_down;
	if (control.zoom != 0) {
		let _pan_x: f32 = ui_view2d_pan_x / ui_view2d_pan_scale;
		let _pan_y: f32 = ui_view2d_pan_y / ui_view2d_pan_scale;
		ui_view2d_pan_scale += control.zoom;
		if (ui_view2d_pan_scale < 0.1) {
			ui_view2d_pan_scale = 0.1;
		}
		if (ui_view2d_pan_scale > 6.0) {
			ui_view2d_pan_scale = 6.0;
		}
		ui_view2d_pan_x = _pan_x * ui_view2d_pan_scale;
		ui_view2d_pan_y = _pan_y * ui_view2d_pan_scale;

		if (zui_touch_scroll()) {
			// Zoom to finger location
			ui_view2d_pan_x -= (ui_view2d_ui.input_x - ui_view2d_ui._window_x - ui_view2d_ui._window_w / 2) * control.zoom;
			ui_view2d_pan_y -= (ui_view2d_ui.input_y - ui_view2d_ui._window_y - ui_view2d_ui._window_h / 2) * control.zoom;
		}
	}

	///if (is_paint || is_sculpt)
	let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;
	let decal_mask: bool = decal && operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.action_paint, shortcut_type_t.DOWN);
	let set_clone_source: bool = context_raw.tool == workspace_tool_t.CLONE && operator_shortcut(config_keymap.set_clone_source + "+" + config_keymap.action_paint, shortcut_type_t.DOWN);

	if (ui_view2d_type == view_2d_type_t.LAYER &&
		!ui_view2d_text_input_hover &&
		(operator_shortcut(config_keymap.action_paint, shortcut_type_t.DOWN) ||
			operator_shortcut(config_keymap.brush_ruler + "+" + config_keymap.action_paint, shortcut_type_t.DOWN) ||
			decal_mask ||
			set_clone_source ||
			config_raw.brush_live)) {
		context_raw.paint2d = true;
	}
	///end

	if (ui_view2d_ui.is_typing) {
		return;
	}

	if (keyboard_started("left")) {
		ui_view2d_pan_x -= 5;
	}
	else if (keyboard_started("right")) {
		ui_view2d_pan_x += 5;
	}
	if (keyboard_started("up")) {
		ui_view2d_pan_y -= 5;
	}
	else if (keyboard_started("down")) {
		ui_view2d_pan_y += 5;
	}

	// Limit panning to keep texture in viewport
	let border: i32 = 32;
	let tw: f32 = ui_view2d_ww * 0.95 * ui_view2d_pan_scale;
	let tx: f32 = ui_view2d_ww / 2 - tw / 2 + ui_view2d_pan_x;
	let hh: f32 = app_h();
	let ty: f32 = hh / 2 - tw / 2 + ui_view2d_pan_y;

	if (tx + border >  ui_view2d_ww) {
		ui_view2d_pan_x =  ui_view2d_ww / 2 + tw / 2 - border;
	}
	else if (tx - border < -tw) {
		ui_view2d_pan_x = -tw / 2 - ui_view2d_ww / 2 + border;
	}
	if (ty + border >  hh) {
		ui_view2d_pan_y =  hh / 2 + tw / 2 - border;
	}
	else if (ty - border < -tw) {
		ui_view2d_pan_y = -tw / 2 - hh / 2 + border;
	}

	if (operator_shortcut(config_keymap.view_reset)) {
		ui_view2d_pan_x = 0.0;
		ui_view2d_pan_y = 0.0;
		ui_view2d_pan_scale = 1.0;
	}
}
