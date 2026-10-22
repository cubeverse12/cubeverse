package pl.minevora.pvphud;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.fabricmc.fabric.api.event.player.AttackEntityCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.item.ItemStack;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.util.ActionResult;
import org.lwjgl.glfw.GLFW;

import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Minecraft Java 1.21.1 Fabric client-side HUD. Does not send game-changing packets. */
public class MinevoraPvpHud implements ClientModInitializer {
    private final Map<String, Setting> settings = new HashMap<>();
    private Path configPath;
    private long configTimestamp = Long.MIN_VALUE;
    private int ticks = 0;
    private boolean leftDown = false, rightDown = false;
    private final ArrayDeque<Long> leftClicks = new ArrayDeque<>();
    private final ArrayDeque<Long> rightClicks = new ArrayDeque<>();
    private int combo = 0;
    private long lastHitNanos = 0;

    private static final String CPS = "CPS Counter";
    private static final String KEYS = "Keystrokes (WASD)";
    private static final String ARMOR = "Armor HUD";
    private static final String POTION = "Potion HUD";
    private static final String FPS = "FPS Counter";
    private static final String CROSSHAIR = "Crosshair Editor";
    private static final String COMBO = "Combo / Hit Color";

    private static final class Setting {
        boolean enabled;
        String position, color, style;
        Setting(boolean enabled, String position, String color, String style) {
            this.enabled = enabled; this.position = position; this.color = color; this.style = style;
        }
    }

    @Override
    public void onInitializeClient() {
        configPath = MinecraftClient.getInstance().runDirectory.toPath().resolve("config/minevora_pvp.json");
        settings.put(CPS, new Setting(true,"Lewy górny","#913bff","Nowoczesny"));
        settings.put(KEYS, new Setting(true,"Prawy górny","#1583ff","Box"));
        settings.put(ARMOR, new Setting(true,"Lewy środek","#21d5ed","Ikony + %"));
        settings.put(POTION, new Setting(true,"Prawy środek","#f8dc46","Lista"));
        settings.put(FPS, new Setting(true,"Lewy dolny","#24d35c","Prosty"));
        settings.put(CROSSHAIR, new Setting(true,"Środek","#fc315f","Kropka + linie"));
        settings.put(COMBO, new Setting(false,"Środek górny","#b967ff","Nowoczesny"));
        reloadConfiguration();

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            if (++ticks % 20 == 0) reloadConfiguration();
            if (System.nanoTime() - lastHitNanos > 2_500_000_000L) combo = 0;
        });
        AttackEntityCallback.EVENT.register((player, world, hand, entity, hitResult) -> {
            if (world.isClient && player == MinecraftClient.getInstance().player) {
                combo++;
                lastHitNanos = System.nanoTime();
            }
            return ActionResult.PASS;
        });
        HudRenderCallback.EVENT.register((context, counter) -> drawHud(context));
    }

    private void reloadConfiguration() {
        try {
            if (!Files.isRegularFile(configPath)) return;
            FileTime modified = Files.getLastModifiedTime(configPath);
            if (modified.toMillis() == configTimestamp) return;
            try (Reader reader = Files.newBufferedReader(configPath, StandardCharsets.UTF_8)) {
                JsonElement parsed = JsonParser.parseReader(reader);
                if (!parsed.isJsonObject()) return;
                JsonObject root = parsed.getAsJsonObject();
                for (Map.Entry<String, Setting> e : settings.entrySet()) {
                    if (!root.has(e.getKey()) || !root.get(e.getKey()).isJsonObject()) continue;
                    JsonObject json = root.getAsJsonObject(e.getKey());
                    Setting setting = e.getValue();
                    if (json.has("enabled") && json.get("enabled").isJsonPrimitive()) setting.enabled = json.get("enabled").getAsBoolean();
                    if (json.has("position") && json.get("position").isJsonPrimitive()) setting.position = json.get("position").getAsString();
                    if (json.has("color") && json.get("color").isJsonPrimitive()) setting.color = json.get("color").getAsString();
                    if (json.has("style") && json.get("style").isJsonPrimitive()) setting.style = json.get("style").getAsString();
                }
                configTimestamp = modified.toMillis();
            }
        } catch (Exception ignored) {
            // An incomplete temporary edit must not crash a multiplayer game.
        }
    }

    private static int color(String color) {
        try { return 0xFF000000 | Integer.parseInt(color.startsWith("#") ? color.substring(1) : color,16); }
        catch (RuntimeException ex) { return 0xFFA76AFF; }
    }

    private void recordClicks(MinecraftClient client) {
        long window = client.getWindow().getHandle();
        long now = System.nanoTime();
        boolean left = GLFW.glfwGetMouseButton(window, GLFW.GLFW_MOUSE_BUTTON_LEFT) == GLFW.GLFW_PRESS;
        boolean right = GLFW.glfwGetMouseButton(window, GLFW.GLFW_MOUSE_BUTTON_RIGHT) == GLFW.GLFW_PRESS;
        if (left && !leftDown) leftClicks.addLast(now);
        if (right && !rightDown) rightClicks.addLast(now);
        leftDown = left; rightDown = right;
        while (!leftClicks.isEmpty() && now - leftClicks.peekFirst() > 1_000_000_000L) leftClicks.removeFirst();
        while (!rightClicks.isEmpty() && now - rightClicks.peekFirst() > 1_000_000_000L) rightClicks.removeFirst();
    }

    private void drawHud(DrawContext context) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null || client.world == null) return;
        recordClicks(client);
        int width = client.getWindow().getScaledWidth();
        int height = client.getWindow().getScaledHeight();
        Map<String,Integer> rows = new HashMap<>();

        Setting cp = settings.get(CPS);
        if (cp.enabled) {
            List<String> lines = List.of("CPS  " + (leftClicks.size()+rightClicks.size()),
                    "LMB " + leftClicks.size() + "    RMB " + rightClicks.size());
            panel(context,client,CPS,cp,lines,width,height,rows);
        }
        Setting ke = settings.get(KEYS);
        if (ke.enabled) {
            String wasd = (client.options.forwardKey.isPressed() ? "[W]" : " W ") + "  " +
                    (client.options.leftKey.isPressed() ? "[A]" : " A ") +
                    (client.options.backKey.isPressed() ? "[S]" : " S ") +
                    (client.options.rightKey.isPressed() ? "[D]" : " D ");
            panel(context,client,KEYS,ke,List.of("WASD",wasd),width,height,rows);
        }
        Setting ar = settings.get(ARMOR);
        if (ar.enabled) {
            List<String> lines = new ArrayList<>(); lines.add("ARMOR HUD");
            int i=0;
            for (ItemStack stack : client.player.getArmorItems()) {
                if (!stack.isEmpty()) {
                    int percentage = stack.isDamageable() && stack.getMaxDamage()>0 ?
                        Math.max(0,100 * (stack.getMaxDamage()-stack.getDamage()) / stack.getMaxDamage()) : 100;
                    String name = stack.getName().getString();
                    if (name.length()>15) name=name.substring(0,15);
                    lines.add(name+" " + percentage+"%");
                }
                i++;
            }
            if (lines.size()==1) lines.add("Brak zbroi");
            panel(context,client,ARMOR,ar,lines,width,height,rows);
        }
        Setting po = settings.get(POTION);
        if (po.enabled) {
            List<String> lines = new ArrayList<>(); lines.add("POTION HUD");
            for (StatusEffectInstance effect : client.player.getStatusEffects()) {
                String effectName = effect.getEffectType().value().getName().getString();
                if (effectName.length()>15) effectName=effectName.substring(0,15);
                int sec=Math.max(0,effect.getDuration()/20);
                lines.add(effectName+" "+ (sec/60)+":"+String.format("%02d",sec%60));
                if (lines.size()>=6) break;
            }
            if (lines.size()==1) lines.add("Brak efektów");
            panel(context,client,POTION,po,lines,width,height,rows);
        }
        Setting fp = settings.get(FPS);
        if (fp.enabled) panel(context,client,FPS,fp,List.of("FPS  " + MinecraftClient.getCurrentFps()),width,height,rows);
        Setting co = settings.get(COMBO);
        if (co.enabled && combo>0) panel(context,client,COMBO,co,List.of("COMBO  " + combo),width,height,rows);
        Setting cross = settings.get(CROSSHAIR);
        if (cross.enabled && client.currentScreen == null) {
            int x=width/2, y=height/2, c=color(cross.color);
            context.fill(x-1,y-1,x+2,y+2,c);
            context.fill(x-9,y-1,x-4,y+1,c);
            context.fill(x+5,y-1,x+10,y+1,c);
            context.fill(x-1,y-9,x+1,y-4,c);
            context.fill(x-1,y+5,x+1,y+10,c);
        }
    }

    private void panel(DrawContext ctx, MinecraftClient client, String name, Setting setting,
                       List<String> lines, int width, int height, Map<String,Integer> rows) {
        int lineHeight=11, padding=6;
        int panelWidth=118;
        for (String line:lines) panelWidth=Math.max(panelWidth,client.textRenderer.getWidth(line)+padding*2);
        int panelHeight=lines.size()*lineHeight+padding*2-2;
        String pos = setting.position;
        int index=rows.getOrDefault(pos,0);
        rows.put(pos,index+panelHeight+6);
        int x=12, y=12;
        switch (pos) {
            case "Prawy górny": x=width-panelWidth-12; y=12+index; break;
            case "Lewy środek": x=12; y=Math.max(12,height/2-panelHeight+index); break;
            case "Prawy środek": x=width-panelWidth-12; y=Math.max(12,height/2-panelHeight+index); break;
            case "Lewy dolny": x=12; y=height-panelHeight-12-index; break;
            case "Prawy dolny": x=width-panelWidth-12; y=height-panelHeight-12-index; break;
            case "Środek": x=(width-panelWidth)/2; y=(height-panelHeight)/2+index; break;
            case "Środek górny": x=(width-panelWidth)/2; y=12+index; break;
            default: x=12; y=12+index;
        }
        x=Math.max(0,Math.min(width-panelWidth,x));
        y=Math.max(0,Math.min(height-panelHeight,y));
        int accent=color(setting.color);
        ctx.fill(x,y,x+panelWidth,y+panelHeight,0xC9141125);
        ctx.fill(x,y,x+2,y+panelHeight,accent);
        int textY=y+padding;
        for (int i=0;i<lines.size();i++) {
            ctx.drawTextWithShadow(client.textRenderer,lines.get(i),x+padding,textY+i*lineHeight,i==0?accent:0xFFFFFFFF);
        }
    }
}
