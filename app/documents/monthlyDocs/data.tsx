import {
    ArrowDownIcon,
    ArrowRightIcon,
    CheckCircledIcon,
    CircleIcon,
    CrossCircledIcon,
    QuestionMarkCircledIcon,
    StopwatchIcon,
} from "@radix-ui/react-icons"

export const labels = [
    {
        value: "bug",
        label: "Bug",
    },
    {
        value: "feature",
        label: "Feature",
    },
    {
        value: "documentation",
        label: "Documentation",
    },
]

export const priorities = [
    
    {
        value: "waiting action",
        label: "Waiting Action",
        icon: CircleIcon,
    },
    {
        value: "work in progress",
        label: "Work In Progress (Applied)",
        icon: StopwatchIcon,
    },
    {
        value: "completed",
        label: "Completed",
        icon: CheckCircledIcon,
    },
    {
        value: "canceled",
        label: "Canceled",
        icon: CrossCircledIcon,
    },
]

export const statuses = [
    {
        value: "due",
        label: "DUE",
        icon: QuestionMarkCircledIcon,
    },
    {
        value: "expired",
        label: "EXPIRED",
        icon: StopwatchIcon,
    },
    {
        value: "safe",
        label: "SAFE",
        icon: ArrowRightIcon,
    },
    {
        value: "error",
        label: "ERROR",
        icon: CrossCircledIcon,
    },
]