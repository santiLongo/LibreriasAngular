import { IconKey } from "../../types/icons";

export interface ButtonProps {
    key: string;
    label: string;
    icon?: IconKey;
    type: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
    disabled?: boolean;
    hidden?: boolean;
}