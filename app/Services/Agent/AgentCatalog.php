<?php

namespace App\Services\Agent;

class AgentCatalog
{
    /**
     * @return array<string, array{id: string, name: string, description: string, permission: string, requires: list<string>}>
     */
    public function plugins(): array
    {
        $plugins = [];

        foreach (config('agent.plugins', []) as $id => $plugin) {
            $plugins[$id] = [
                'id' => $id,
                'name' => $plugin['name'],
                'description' => $plugin['description'],
                'permission' => $plugin['permission'],
                'requires' => array_values($plugin['requires'] ?? []),
            ];
        }

        return $plugins;
    }

    /**
     * @return array<string, array{id: string, name: string, description: string, wired: bool, fields: list<string>}>
     */
    public function connectors(): array
    {
        $connectors = [];

        foreach (config('agent.connectors', []) as $id => $connector) {
            $connectors[$id] = [
                'id' => $id,
                'name' => $connector['name'],
                'description' => $connector['description'],
                'wired' => (bool) ($connector['wired'] ?? false),
                'fields' => array_values($connector['fields'] ?? []),
            ];
        }

        return $connectors;
    }

    public function plugin(string $id): ?array
    {
        return $this->plugins()[$id] ?? null;
    }

    public function connector(string $id): ?array
    {
        return $this->connectors()[$id] ?? null;
    }

    /**
     * @return array<string, array{id: string, name: string, description: string, plugin: string|null, connector: string|null}>
     */
    public function tools(): array
    {
        $tools = [];

        foreach (config('agent.tools', []) as $id => $tool) {
            $tools[$id] = [
                'id' => $id,
                'name' => $tool['name'],
                'description' => $tool['description'],
                'plugin' => $tool['plugin'] ?? null,
                'connector' => $tool['connector'] ?? null,
            ];
        }

        return $tools;
    }

    public function tool(string $id): ?array
    {
        return $this->tools()[$id] ?? null;
    }

    /**
     * @return list<string>
     */
    public function pluginIds(): array
    {
        return array_keys($this->plugins());
    }

    /**
     * @return list<string>
     */
    public function connectorIds(): array
    {
        return array_keys($this->connectors());
    }
}
