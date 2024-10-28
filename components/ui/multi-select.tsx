// components/ui/multi-select.tsx

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface Option {
    label: string;
    value: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (values: string[]) => void;
    className?: string;
    placeholder?: string;
    emptyText?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    className,
    placeholder = "Select items",
    emptyText = "No items found.",
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Filter options based on search query
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Find selected items' labels
    const selectedLabels = selected.map(
        (value) => options.find((option) => option.value === value)?.label ?? value
    );

    const toggleOption = (value: string) => {
        const updatedSelected = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];
        onChange(updatedSelected);
    };

    const removeItem = (valueToRemove: string) => {
        onChange(selected.filter((value) => value !== valueToRemove));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "min-h-[40px] h-auto w-full justify-between px-3 py-2",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedLabels.length > 0 ? (
                            selectedLabels.map((label) => (
                                <Badge
                                    variant="secondary"
                                    key={label}
                                    className="mr-1 mb-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const value = options.find((opt) => opt.label === label)?.value;
                                        if (value) removeItem(value);
                                    }}
                                >
                                    {label}
                                    <button
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                const value = options.find((opt) => opt.label === label)?.value;
                                                if (value) removeItem(value);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const value = options.find((opt) => opt.label === label)?.value;
                                            if (value) removeItem(value);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder="Search..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="h-9"
                    />
                    <CommandEmpty className="py-2 text-center text-sm">
                        {emptyText}
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                        {filteredOptions.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => toggleOption(option.value)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selected.includes(option.value)
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}