export interface Stream {
  id: string;
  creator_user_id: string;
  outputs: any[];
  matching_type: string;
  description: string;
  created_at: Date;
  disabled: boolean;
  rules: any[];
  alert_conditions: any[];
  alert_receivers: any[];
  title: string;
  content_pack?: any;
  remove_matches_from_default_stream: boolean;
  index_set_id: string;
  is_default: boolean;
}