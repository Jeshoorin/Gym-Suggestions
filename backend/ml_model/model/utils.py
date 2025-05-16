import pandas as pd
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_user_profile(username, path='data/user_profiles.csv'):
    profiles = pd.read_csv(path)
    return profiles[profiles['username'] == username].iloc[0]


def load_user_logs(username, path='data/diet_logs.csv'):
    logs = pd.read_csv(path)
    return logs[logs['username'] == username]


def load_all_logs(path='data/diet_logs.csv'):
    return pd.read_csv(path)


def load_food_items(path='data/food_items.csv'):
    return pd.read_csv(path)


def filter_food_by_dietary_restrictions(food_df, restrictions):
    restrictions = restrictions.lower().split('|')
    for restriction in restrictions:
        col = restriction.strip().capitalize().replace('-', '')
        if col in food_df.columns:
            food_df = food_df[food_df[col] == True]
    return food_df
